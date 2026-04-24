import { randomBytes } from 'crypto';
import type pg from 'pg';
import {
  REFERRAL_QUALIFY_TASK_CHANGES,
  REFERRAL_QUALIFY_ACTIVE_DAYS,
  REFERRAL_REFERRER_CAP,
  type ReferralStats,
  type ReferralInvitee,
  type ReferralStatus,
} from '@shared';
import { logger } from '../lib/logger';

// ────────────────────────────────────────────────────────────
// Code generation
// ────────────────────────────────────────────────────────────

function generateCandidateCode(): string {
  return randomBytes(6).toString('hex').slice(0, 8).toLowerCase();
}

/**
 * Generate a unique referral_code for a user. Retries on collision (rare).
 * Safe to call repeatedly — if the user already has one, returns it.
 */
export async function ensureReferralCode(pool: pg.Pool, userId: string): Promise<string> {
  const { rows } = await pool.query<{ referral_code: string | null }>(
    'SELECT referral_code FROM users WHERE id = $1',
    [userId],
  );
  if (rows[0]?.referral_code) return rows[0].referral_code;

  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = generateCandidateCode();
    try {
      await pool.query('UPDATE users SET referral_code = $1 WHERE id = $2', [candidate, userId]);
      return candidate;
    } catch (err: any) {
      if (err?.code === '23505') continue; // unique_violation → retry
      throw err;
    }
  }
  throw new Error('Could not generate a unique referral code after 8 attempts');
}

// ────────────────────────────────────────────────────────────
// Attribution at signup
// ────────────────────────────────────────────────────────────

/**
 * Link a new user to a referrer based on a referral code.
 * Rejects silently (returns false) on invalid code, self-referral, or duplicate signup IP.
 * Never throws to the caller — referral failure must not break signup.
 */
export async function attachReferrer(
  pool: pg.Pool,
  referredUserId: string,
  rawCode: string | undefined | null,
  signupIp: string | null,
): Promise<boolean> {
  if (!rawCode) return false;
  const code = rawCode.trim().toLowerCase();
  if (!code || code.length > 32) return false;

  try {
    const { rows: refRows } = await pool.query<{ id: string }>(
      'SELECT id FROM users WHERE referral_code = $1',
      [code],
    );
    const referrerId = refRows[0]?.id;
    if (!referrerId) return false;
    if (referrerId === referredUserId) return false;

    // Anti-abuse: same signup IP as an existing referral from this referrer.
    if (signupIp) {
      const { rows: ipRows } = await pool.query(
        `SELECT 1 FROM referrals
         WHERE referrer_user_id = $1 AND signup_ip = $2
         LIMIT 1`,
        [referrerId, signupIp],
      );
      if (ipRows.length > 0) return false;
    }

    await pool.query(
      `INSERT INTO referrals (referrer_user_id, referred_user_id, signup_ip)
       VALUES ($1, $2, $3)
       ON CONFLICT (referred_user_id) DO NOTHING`,
      [referrerId, referredUserId, signupIp],
    );
    return true;
  } catch (err) {
    logger.error({ err, referredUserId }, 'attachReferrer failed');
    return false;
  }
}

// ────────────────────────────────────────────────────────────
// Qualification
// ────────────────────────────────────────────────────────────

/**
 * Check whether a referred user meets the qualification criteria and, if so,
 * mark the referral qualified and grant 1 month of credit to both sides
 * (respecting the referrer cap).
 *
 * Criteria (within REFERRAL_QUALIFY_WINDOW_DAYS of referral creation):
 *  - ≥ REFERRAL_QUALIFY_TASK_CHANGES rows in task_status_history for the user's tasks
 *  - ≥ REFERRAL_QUALIFY_ACTIVE_DAYS distinct calendar days among those rows
 *
 * Idempotent: safe to call on every task status change. Credits are only
 * created once per referral side.
 *
 * Never throws — referral failure must not break the triggering endpoint.
 */
export async function evaluateReferralQualification(
  pool: pg.Pool,
  referredUserId: string,
): Promise<void> {
  try {
    const { rows: refRows } = await pool.query<{
      id: string;
      referrer_user_id: string;
      created_at: Date;
      expires_at: Date;
      qualified_at: Date | null;
      referrer_reward_granted_at: Date | null;
      referred_reward_granted_at: Date | null;
    }>(
      `SELECT id, referrer_user_id, created_at, expires_at,
              qualified_at, referrer_reward_granted_at, referred_reward_granted_at
       FROM referrals
       WHERE referred_user_id = $1`,
      [referredUserId],
    );
    const referral = refRows[0];
    if (!referral) return;

    // Already fully granted → nothing to do.
    if (referral.referrer_reward_granted_at && referral.referred_reward_granted_at) return;

    // Expired and never qualified → nothing to do.
    const now = new Date();
    if (!referral.qualified_at && referral.expires_at < now) return;

    // If not yet qualified, check criteria against task_status_history in the window.
    let qualifiedAt = referral.qualified_at;
    if (!qualifiedAt) {
      const { rows: statRows } = await pool.query<{ changes: string; active_days: string }>(
        `SELECT
           COUNT(*)::text AS changes,
           COUNT(DISTINCT DATE(tsh.changed_at))::text AS active_days
         FROM task_status_history tsh
         JOIN tasks t ON t.id = tsh.task_id
         WHERE t.user_id = $1
           AND tsh.changed_at >= $2
           AND tsh.changed_at <= $3
           AND tsh.from_status IS NOT NULL`,
        [referredUserId, referral.created_at, referral.expires_at],
      );
      const changes = parseInt(statRows[0]?.changes ?? '0', 10);
      const activeDays = parseInt(statRows[0]?.active_days ?? '0', 10);

      if (changes < REFERRAL_QUALIFY_TASK_CHANGES) return;
      if (activeDays < REFERRAL_QUALIFY_ACTIVE_DAYS) return;

      const upd = await pool.query<{ qualified_at: Date }>(
        `UPDATE referrals SET qualified_at = NOW()
         WHERE id = $1 AND qualified_at IS NULL
         RETURNING qualified_at`,
        [referral.id],
      );
      qualifiedAt = upd.rows[0]?.qualified_at ?? new Date();
    }

    // Grant referred-side credit (one shot).
    if (!referral.referred_reward_granted_at) {
      await pool.query('BEGIN');
      try {
        const marked = await pool.query(
          `UPDATE referrals SET referred_reward_granted_at = NOW()
           WHERE id = $1 AND referred_reward_granted_at IS NULL`,
          [referral.id],
        );
        if (marked.rowCount && marked.rowCount > 0) {
          await pool.query(
            `INSERT INTO referral_credits (user_id, months, source_referral_id, reason)
             VALUES ($1, 1, $2, 'referred_reward')`,
            [referredUserId, referral.id],
          );
        }
        await pool.query('COMMIT');
      } catch (err) {
        await pool.query('ROLLBACK').catch(() => {});
        throw err;
      }
    }

    // Grant referrer-side credit (respect cap).
    if (!referral.referrer_reward_granted_at) {
      await pool.query('BEGIN');
      try {
        const { rows: capRows } = await pool.query<{ cnt: string }>(
          `SELECT COUNT(*)::text AS cnt FROM referrals
           WHERE referrer_user_id = $1 AND referrer_reward_granted_at IS NOT NULL`,
          [referral.referrer_user_id],
        );
        const alreadyGranted = parseInt(capRows[0]?.cnt ?? '0', 10);
        if (alreadyGranted < REFERRAL_REFERRER_CAP) {
          const marked = await pool.query(
            `UPDATE referrals SET referrer_reward_granted_at = NOW()
             WHERE id = $1 AND referrer_reward_granted_at IS NULL`,
            [referral.id],
          );
          if (marked.rowCount && marked.rowCount > 0) {
            await pool.query(
              `INSERT INTO referral_credits (user_id, months, source_referral_id, reason)
               VALUES ($1, 1, $2, 'referrer_reward')`,
              [referral.referrer_user_id, referral.id],
            );
          }
        }
        await pool.query('COMMIT');
      } catch (err) {
        await pool.query('ROLLBACK').catch(() => {});
        throw err;
      }
    }
  } catch (err) {
    logger.error({ err, referredUserId }, 'evaluateReferralQualification failed');
  }
}

// ────────────────────────────────────────────────────────────
// Stats for UI
// ────────────────────────────────────────────────────────────

export async function getReferralStats(pool: pg.Pool, userId: string): Promise<ReferralStats> {
  const code = await ensureReferralCode(pool, userId);

  const { rows: inviteeRows } = await pool.query<{
    id: string;
    created_at: Date;
    expires_at: Date;
    qualified_at: Date | null;
  }>(
    `SELECT id, created_at, expires_at, qualified_at
     FROM referrals
     WHERE referrer_user_id = $1
     ORDER BY created_at DESC`,
    [userId],
  );

  const now = new Date();
  const invitees: ReferralInvitee[] = inviteeRows.map((r) => {
    let status: ReferralStatus;
    if (r.qualified_at) status = 'qualified';
    else if (r.expires_at < now) status = 'expired';
    else status = 'pending';
    return {
      referralId: r.id,
      status,
      createdAt: r.created_at.toISOString(),
      expiresAt: r.expires_at.toISOString(),
      qualifiedAt: r.qualified_at ? r.qualified_at.toISOString() : null,
    };
  });

  const qualifiedCount = invitees.filter((i) => i.status === 'qualified').length;
  const pendingCount = invitees.filter((i) => i.status === 'pending').length;

  const { rows: creditRows } = await pool.query<{
    total: string;
    redeemed: string;
  }>(
    `SELECT
       COALESCE(SUM(months), 0)::text AS total,
       COALESCE(SUM(CASE WHEN redeemed_at IS NOT NULL THEN months ELSE 0 END), 0)::text AS redeemed
     FROM referral_credits
     WHERE user_id = $1`,
    [userId],
  );
  const creditsEarned = parseInt(creditRows[0]?.total ?? '0', 10);
  const creditsRedeemed = parseInt(creditRows[0]?.redeemed ?? '0', 10);

  return {
    referralCode: code,
    qualifiedCount,
    cap: REFERRAL_REFERRER_CAP,
    pendingCount,
    creditsEarned,
    creditsRedeemed,
    invitees,
  };
}

// ────────────────────────────────────────────────────────────
// Redemption (Fase 2 — called when EARLY_ACCESS is turned off)
// ────────────────────────────────────────────────────────────

/**
 * Convert all unredeemed referral credits into months of subscription by
 * extending users.subscribed_until. Idempotent: credits already redeemed
 * are skipped.
 *
 * Returns a summary suitable for admin logs.
 */
export async function redeemAllReferralCredits(pool: pg.Pool): Promise<{
  usersAffected: number;
  creditsRedeemed: number;
  monthsGranted: number;
}> {
  const { rows } = await pool.query<{
    user_id: string;
    ids: string[];
    months: string;
  }>(
    `SELECT user_id,
            ARRAY_AGG(id) AS ids,
            SUM(months)::text AS months
     FROM referral_credits
     WHERE redeemed_at IS NULL
     GROUP BY user_id`,
  );

  let usersAffected = 0;
  let creditsRedeemed = 0;
  let monthsGranted = 0;

  for (const row of rows) {
    const months = parseInt(row.months, 10);
    if (months <= 0) continue;

    await pool.query('BEGIN');
    try {
      // Extend subscribed_until: start from whichever is later (now vs current value),
      // then add the months. Handles both "no current sub" and "already paid until X".
      await pool.query(
        `UPDATE users
         SET subscribed_until = GREATEST(COALESCE(subscribed_until, NOW()), NOW())
                                + ($2::int * INTERVAL '1 month')
         WHERE id = $1`,
        [row.user_id, months],
      );
      await pool.query(
        `UPDATE referral_credits
         SET redeemed_at = NOW()
         WHERE id = ANY($1::uuid[]) AND redeemed_at IS NULL`,
        [row.ids],
      );
      await pool.query('COMMIT');
      usersAffected += 1;
      creditsRedeemed += row.ids.length;
      monthsGranted += months;
    } catch (err) {
      await pool.query('ROLLBACK').catch(() => {});
      logger.error({ err, userId: row.user_id }, 'redeemAllReferralCredits: user failed');
    }
  }

  return { usersAffected, creditsRedeemed, monthsGranted };
}
