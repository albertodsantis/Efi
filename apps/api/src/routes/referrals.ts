import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import type pg from 'pg';
import type { ReferralStatsResponse, SessionUser } from '@shared';
import { getReferralStats } from '../services/referrals';

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

export function createReferralsRouter(pool: pg.Pool) {
  const router = Router();
  router.use(requireAuth(pool));

  router.get('/me', async (req, res) => {
    try {
      const userId = (req as any).userId as string;
      const stats = await getReferralStats(pool, userId);
      const response: ReferralStatsResponse = { stats };
      res.json(response);
    } catch (err) {
      console.error('Referral stats error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
