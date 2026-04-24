-- ============================================================
-- REFERRALS
-- Users invite friends via a unique code. When the invited user
-- meets activity criteria (10 task-status changes across 7 distinct
-- days within 60d of signup), both sides accrue 1 month of credit.
-- Credits sit in referral_credits until redeemed (when EARLY_ACCESS
-- is turned off) by extending users.subscribed_until.
--
-- Referrer cap: 3 qualified referrals = 3 months max.
-- Referred cap: exactly 1 credit per user (one referrer per user).
-- ============================================================

-- Short unique code generated per user. Nullable at first; backfilled below.
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT;

-- Generate codes for existing users (8-char base36 from random bytes).
-- Loops until unique. Works even if column already has some values.
DO $$
DECLARE
  u RECORD;
  new_code TEXT;
BEGIN
  FOR u IN SELECT id FROM users WHERE referral_code IS NULL LOOP
    LOOP
      new_code := LOWER(SUBSTRING(ENCODE(gen_random_bytes(6), 'hex') FROM 1 FOR 8));
      BEGIN
        UPDATE users SET referral_code = new_code WHERE id = u.id;
        EXIT;
      EXCEPTION WHEN unique_violation THEN
        -- collision, retry
      END;
    END LOOP;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referral_code
  ON users (referral_code)
  WHERE referral_code IS NOT NULL;

-- ============================================================
-- REFERRALS — attribution + qualification state
-- One row per invited user. referred_user_id is UNIQUE so a user
-- can only ever have one referrer.
-- ============================================================
CREATE TABLE IF NOT EXISTS referrals (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id            UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at                  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '60 days'),
  qualified_at                TIMESTAMPTZ,
  signup_ip                   TEXT,
  referrer_reward_granted_at  TIMESTAMPTZ,
  referred_reward_granted_at  TIMESTAMPTZ,
  CONSTRAINT referrals_no_self_ref CHECK (referrer_user_id <> referred_user_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer
  ON referrals (referrer_user_id);

CREATE INDEX IF NOT EXISTS idx_referrals_pending
  ON referrals (referred_user_id)
  WHERE qualified_at IS NULL;

-- ============================================================
-- REFERRAL CREDITS — the bank.
-- One row per month earned. redeemed_at is NULL until the Fase 2
-- switch adds the months to users.subscribed_until.
-- ============================================================
CREATE TABLE IF NOT EXISTS referral_credits (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  months              INTEGER NOT NULL DEFAULT 1 CHECK (months > 0),
  source_referral_id  UUID REFERENCES referrals(id) ON DELETE SET NULL,
  reason              TEXT NOT NULL, -- 'referrer_reward' | 'referred_reward'
  earned_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  redeemed_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_referral_credits_user
  ON referral_credits (user_id);

CREATE INDEX IF NOT EXISTS idx_referral_credits_unredeemed
  ON referral_credits (user_id)
  WHERE redeemed_at IS NULL;

-- Consistency with other tables (backend bypasses RLS as superuser).
ALTER TABLE referrals        ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_credits ENABLE ROW LEVEL SECURITY;
