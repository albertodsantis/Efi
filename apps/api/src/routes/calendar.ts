import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { google } from 'googleapis';
import type pg from 'pg';
import type {
  CalendarStatusResponse,
  CalendarSyncDownRequest,
  CalendarSyncDownResponse,
  CalendarSyncRequest,
  CalendarSyncResponse,
  SessionUser,
} from '@shared';

export interface GoogleCreds {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

/** Create a fresh OAuth2 client — safe to mutate per-request. */
function makeOAuth2Client(creds: GoogleCreds) {
  return new google.auth.OAuth2(creds.clientId, creds.clientSecret, creds.redirectUri);
}

/** Require authenticated session — verifies the user still exists in DB. */
function requireAuth(pool: pg.Pool) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user: SessionUser | undefined = (req.session as any).user;
    if (!user?.id) {
      return res.status(401).json({ error: 'No autenticado.' });
    }
    const { rows } = await pool.query('SELECT id FROM users WHERE id = $1', [user.id]);
    if (rows.length === 0) {
      req.session.destroy(() => {});
      return res.status(401).json({ error: 'Sesión inválida.' });
    }
    (req as any).userId = user.id;
    next();
  };
}

/**
 * Resolves Google Calendar tokens for the current user.
 * Priority: session → DB (with auto-refresh if expired).
 * Returns null if no tokens are available.
 */
async function resolveTokens(
  req: Express.Request,
  pool: pg.Pool,
  creds: GoogleCreds,
): Promise<Record<string, unknown> | null> {
  const sessionTokens = (req.session as any).tokens;
  if (sessionTokens) return sessionTokens;

  const userId = (req.session as any).user?.id;
  if (!userId) return null;

  const { rows } = await pool.query<{
    gcal_access_token: string | null;
    gcal_refresh_token: string | null;
    gcal_token_expiry: Date | null;
  }>(
    'SELECT gcal_access_token, gcal_refresh_token, gcal_token_expiry FROM users WHERE id = $1',
    [userId],
  );

  const row = rows[0];
  if (!row?.gcal_refresh_token) return null;

  const expiryMs = row.gcal_token_expiry ? new Date(row.gcal_token_expiry).getTime() : 0;
  const isExpired = !row.gcal_access_token || expiryMs < Date.now() + 60_000;

  if (isExpired) {
    const client = makeOAuth2Client(creds);
    client.setCredentials({ refresh_token: row.gcal_refresh_token });
    const { credentials } = await client.refreshAccessToken();

    await pool.query(
      `UPDATE users
       SET gcal_access_token = $1, gcal_token_expiry = $2
       WHERE id = $3`,
      [
        credentials.access_token ?? null,
        credentials.expiry_date ? new Date(credentials.expiry_date) : null,
        userId,
      ],
    );

    const refreshedTokens: Record<string, unknown> = { ...credentials };
    (req.session as any).tokens = refreshedTokens;
    return refreshedTokens;
  }

  const tokens = {
    access_token: row.gcal_access_token,
    refresh_token: row.gcal_refresh_token,
    expiry_date: expiryMs,
  };
  (req.session as any).tokens = tokens;
  return tokens;
}

export function createCalendarRouter(creds: GoogleCreds, pool: pg.Pool) {
  const router = Router();

  // All calendar routes require authentication
  router.use(requireAuth(pool));

  // ── GET /status ───────────────────────────────────────────────

  router.get('/status', async (req, res) => {
    try {
      const userId = (req.session as any).user?.id;
      if (!userId) {
        const response: CalendarStatusResponse = { connected: false };
        return res.json(response);
      }

      const { rows } = await pool.query<{ gcal_refresh_token: string | null }>(
        'SELECT gcal_refresh_token FROM users WHERE id = $1',
        [userId],
      );

      const response: CalendarStatusResponse = {
        connected: Boolean(rows[0]?.gcal_refresh_token),
      };
      res.json(response);
    } catch (error) {
      console.error('Calendar status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ── DELETE /disconnect ────────────────────────────────────────

  router.delete('/disconnect', async (req, res) => {
    try {
      const userId = (req.session as any).user?.id;
      if (!userId) return res.status(401).json({ error: 'Not authenticated' });

      const { rows } = await pool.query<{ gcal_access_token: string | null }>(
        'SELECT gcal_access_token FROM users WHERE id = $1',
        [userId],
      );

      const accessToken = rows[0]?.gcal_access_token;
      if (accessToken) {
        try {
          const client = makeOAuth2Client(creds);
          await client.revokeToken(accessToken);
        } catch {
          // Best-effort revocation; proceed regardless
        }
      }

      await pool.query(
        `UPDATE users
         SET gcal_access_token = NULL, gcal_refresh_token = NULL, gcal_token_expiry = NULL
         WHERE id = $1`,
        [userId],
      );

      (req.session as any).tokens = null;

      res.json({ success: true });
    } catch (error) {
      console.error('Calendar disconnect error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ── POST /sync ────────────────────────────────────────────────

  router.post('/sync', async (req, res) => {
    const tokens = await resolveTokens(req, pool, creds);
    if (!tokens) return res.status(401).json({ error: 'Google Calendar not connected' });

    const client = makeOAuth2Client(creds);
    client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: client });
    const { task } = req.body as CalendarSyncRequest;

    try {
      const event = {
        summary: `Entrega: ${task.title}`,
        description: `Partner: ${task.partnerName}\n\n${task.description}`,
        start: { date: task.dueDate, timeZone: 'UTC' },
        end: { date: task.dueDate, timeZone: 'UTC' },
      };

      let result;
      if (task.gcalEventId) {
        result = await calendar.events.update({
          calendarId: 'primary',
          eventId: task.gcalEventId,
          requestBody: event,
        });
      } else {
        result = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: event,
        });
      }

      const response: CalendarSyncResponse = {
        success: true,
        eventId: result.data.id ?? null,
      };
      res.json(response);
    } catch (error) {
      console.error('Error syncing to calendar', error);
      res.status(500).json({ error: 'Failed to sync to calendar' });
    }
  });

  // ── POST /sync-down ───────────────────────────────────────────

  router.post('/sync-down', async (req, res) => {
    const tokens = await resolveTokens(req, pool, creds);
    if (!tokens) return res.status(401).json({ error: 'Google Calendar not connected' });

    const client = makeOAuth2Client(creds);
    client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: client });
    const { eventIds } = req.body as CalendarSyncDownRequest;

    if (!eventIds || !Array.isArray(eventIds)) {
      return res.status(400).json({ error: 'eventIds array is required' });
    }

    try {
      const updatedEvents: CalendarSyncDownResponse['updatedEvents'] = [];

      for (const eventId of eventIds) {
        try {
          const response = await calendar.events.get({ calendarId: 'primary', eventId });

          if (response.data?.start) {
            const date =
              response.data.start.date ||
              (response.data.start.dateTime ? response.data.start.dateTime.split('T')[0] : null);

            if (date) updatedEvents.push({ eventId, dueDate: date });
          }
        } catch (error: any) {
          if (error.code !== 404) console.error(`Error fetching event ${eventId}`, error);
        }
      }

      const response: CalendarSyncDownResponse = { success: true, updatedEvents };
      res.json(response);
    } catch (error) {
      console.error('Error syncing down from calendar', error);
      res.status(500).json({ error: 'Failed to sync down from calendar' });
    }
  });

  return router;
}
