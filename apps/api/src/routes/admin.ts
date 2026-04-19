import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import type pg from 'pg';
import { timingSafeEqual } from 'crypto';
import { logger } from '../lib/logger';

function requireAdminKey(expected: string) {
  const expectedBuf = Buffer.from(expected);
  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.get('authorization') || '';
    const provided = header.startsWith('Bearer ')
      ? header.slice(7)
      : typeof req.query.key === 'string'
        ? req.query.key
        : '';
    const providedBuf = Buffer.from(provided);
    if (
      providedBuf.length !== expectedBuf.length ||
      !timingSafeEqual(providedBuf, expectedBuf)
    ) {
      logger.warn({ ip: req.ip, path: req.path }, 'Admin auth failed');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  };
}

export function createAdminRouter(pool: pg.Pool, adminKey: string | undefined) {
  const router = Router();

  if (!adminKey) {
    router.use((_req, res) => {
      res.status(503).json({ error: 'Admin API disabled — ADMIN_API_KEY not configured.' });
    });
    return router;
  }

  router.use(requireAdminKey(adminKey));

  router.get('/stats', async (_req, res) => {
    try {
      const [
        usersTotal,
        usersActive7d,
        usersActive30d,
        usersNew7d,
        tasksTotal,
        tasksNew7d,
        partnersTotal,
        partnersNew7d,
        sessionsActive,
      ] = await Promise.all([
        pool.query(`SELECT COUNT(*)::int AS n FROM users`),
        pool.query(
          `SELECT COUNT(DISTINCT user_id)::int AS n FROM task_status_history
           WHERE changed_at > NOW() - INTERVAL '7 days'`,
        ),
        pool.query(
          `SELECT COUNT(DISTINCT user_id)::int AS n FROM task_status_history
           WHERE changed_at > NOW() - INTERVAL '30 days'`,
        ),
        pool.query(
          `SELECT COUNT(*)::int AS n FROM users
           WHERE created_at > NOW() - INTERVAL '7 days'`,
        ),
        pool.query(`SELECT COUNT(*)::int AS n FROM tasks`),
        pool.query(
          `SELECT COUNT(*)::int AS n FROM tasks
           WHERE created_at > NOW() - INTERVAL '7 days'`,
        ),
        pool.query(`SELECT COUNT(*)::int AS n FROM partners`),
        pool.query(
          `SELECT COUNT(*)::int AS n FROM partners
           WHERE created_at > NOW() - INTERVAL '7 days'`,
        ),
        pool.query(`SELECT COUNT(*)::int AS n FROM session WHERE expire > NOW()`),
      ]);

      res.json({
        timestamp: new Date().toISOString(),
        uptime: Math.round(process.uptime()),
        users: {
          total: usersTotal.rows[0].n,
          active7d: usersActive7d.rows[0].n,
          active30d: usersActive30d.rows[0].n,
          new7d: usersNew7d.rows[0].n,
        },
        tasks: {
          total: tasksTotal.rows[0].n,
          new7d: tasksNew7d.rows[0].n,
        },
        partners: {
          total: partnersTotal.rows[0].n,
          new7d: partnersNew7d.rows[0].n,
        },
        sessions: {
          active: sessionsActive.rows[0].n,
        },
      });
    } catch (err) {
      logger.error({ err }, 'Admin stats error');
      res.status(500).json({ error: 'Failed to compute stats' });
    }
  });

  return router;
}
