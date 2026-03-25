import { randomUUID } from 'crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { google } from 'googleapis';
import type pg from 'pg';
import type {
  AuthStatusResponse,
  DeleteAccountResponse,
  GoogleAuthUrlResponse,
  LoginRequest,
  LogoutResponse,
  MeResponse,
  RegisterRequest,
  SessionUser,
} from '@shared';

type OAuthClient = InstanceType<typeof google.auth.OAuth2>;

interface AppStore {
  updateProfile(updates: { name?: string; avatar?: string }): any;
}

const BCRYPT_ROUNDS = 10;

export function createAuthRouter(
  oauth2Client: OAuthClient,
  appUrl: string,
  appStore: AppStore,
  pool: pg.Pool,
) {
  const router = Router();

  // ── Session user helpers ──────────────────────────────────────

  const getSessionUser = (req: Express.Request): SessionUser | null =>
    (req.session as any).user ?? null;

  const setSessionUser = (req: Express.Request, user: SessionUser) => {
    (req.session as any).user = user;
  };

  // ── GET /me ───────────────────────────────────────────────────

  router.get('/me', (req, res) => {
    const response: MeResponse = { user: getSessionUser(req) };
    res.json(response);
  });

  // ── POST /register ────────────────────────────────────────────

  router.post('/register', async (req, res) => {
    const { email, password, name } = req.body as RegisterRequest;

    if (!email?.trim() || !password || !name?.trim()) {
      return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    try {
      const { rows: existing } = await pool.query(
        'SELECT id FROM users WHERE LOWER(email) = $1',
        [trimmedEmail],
      );

      if (existing.length > 0) {
        return res.status(409).json({ error: 'Ya existe una cuenta con ese email.' });
      }

      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

      await pool.query(
        `INSERT INTO users (id, email, password_hash, name, provider)
         VALUES ($1, $2, $3, $4, 'email')`,
        [randomUUID(), trimmedEmail, passwordHash, trimmedName],
      );

      const user: SessionUser = {
        email: trimmedEmail,
        name: trimmedName,
        avatar: '',
        provider: 'email',
      };

      setSessionUser(req, user);

      try {
        await appStore.updateProfile({ name: user.name });
      } catch (err) {
        console.error('Failed to sync profile on register:', err);
      }

      const response: MeResponse = { user };
      res.status(201).json(response);
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Error al crear la cuenta.' });
    }
  });

  // ── POST /login ───────────────────────────────────────────────

  router.post('/login', async (req, res) => {
    const { email, password } = req.body as LoginRequest;

    if (!email?.trim() || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios.' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    try {
      const { rows } = await pool.query(
        'SELECT id, email, password_hash, name, avatar, provider FROM users WHERE LOWER(email) = $1',
        [trimmedEmail],
      );

      if (rows.length === 0) {
        return res
          .status(404)
          .json({ error: 'No encontramos una cuenta con ese email.', code: 'USER_NOT_FOUND' });
      }

      const dbUser = rows[0];
      const valid = await bcrypt.compare(password, dbUser.password_hash);

      if (!valid) {
        return res.status(401).json({ error: 'Email o contraseña incorrectos.' });
      }

      const user: SessionUser = {
        email: dbUser.email,
        name: dbUser.name,
        avatar: dbUser.avatar || '',
        provider: dbUser.provider,
      };

      setSessionUser(req, user);

      try {
        await appStore.updateProfile({ name: user.name });
      } catch (err) {
        console.error('Failed to sync profile on login:', err);
      }

      const response: MeResponse = { user };
      res.json(response);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Error al iniciar sesion.' });
    }
  });

  // ── POST /logout ──────────────────────────────────────────────

  router.post('/logout', (req, res) => {
    (req.session as any).user = null;
    (req.session as any).tokens = null;
    const response: LogoutResponse = { success: true };
    res.json(response);
  });

  // ── DELETE /account ─────────────────────────────────────────

  router.delete('/account', async (req, res) => {
    const sessionUser = getSessionUser(req);

    if (sessionUser?.email) {
      try {
        await pool.query('DELETE FROM users WHERE LOWER(email) = $1', [
          sessionUser.email.toLowerCase(),
        ]);
      } catch (err) {
        console.error('Error deleting user row:', err);
      }
    }

    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
      }
    });

    const response: DeleteAccountResponse = { success: true };
    res.json(response);
  });

  // ── Google OAuth: login flow ──────────────────────────────────

  router.get('/google/login-url', (req, res) => {
    const state = randomUUID();
    (req.session as any).oauthState = state;
    (req.session as any).oauthIntent = 'login';

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'openid',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
      prompt: 'consent',
      state,
    });

    const response: GoogleAuthUrlResponse = { url };
    res.json(response);
  });

  // ── Google OAuth: calendar integration flow ───────────────────

  router.get('/google/url', (req, res) => {
    const state = randomUUID();
    (req.session as any).oauthState = state;
    (req.session as any).oauthIntent = 'calendar';

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.readonly',
      ],
      prompt: 'consent',
      state,
    });

    const response: GoogleAuthUrlResponse = { url };
    res.json(response);
  });

  // ── Google OAuth: shared callback ─────────────────────────────

  router.get('/google/callback', async (req, res) => {
    const { code, state } = req.query;

    if (!state || state !== (req.session as any).oauthState) {
      return res.status(403).send('Invalid OAuth state parameter');
    }

    const intent: string = (req.session as any).oauthIntent ?? 'calendar';

    try {
      const { tokens } = await oauth2Client.getToken(code as string);
      delete (req.session as any).oauthState;
      delete (req.session as any).oauthIntent;

      if (intent === 'login') {
        oauth2Client.setCredentials(tokens);
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const { data } = await oauth2.userinfo.get();

        const googleEmail = (data.email ?? '').toLowerCase();
        const googleName = data.name ?? '';
        const googleAvatar = data.picture ?? '';

        // Upsert user row for Google auth
        const { rows: existing } = await pool.query(
          'SELECT id FROM users WHERE LOWER(email) = $1',
          [googleEmail],
        );

        if (existing.length === 0) {
          await pool.query(
            `INSERT INTO users (id, email, password_hash, name, avatar, provider)
             VALUES ($1, $2, '', $3, $4, 'google')`,
            [randomUUID(), googleEmail, googleName, googleAvatar],
          );
        } else {
          await pool.query(
            `UPDATE users SET name = $1, avatar = $2, provider = 'google', updated_at = NOW()
             WHERE LOWER(email) = $3`,
            [googleName, googleAvatar, googleEmail],
          );
        }

        const user: SessionUser = {
          email: googleEmail,
          name: googleName,
          avatar: googleAvatar,
          provider: 'google',
        };

        setSessionUser(req, user);

        try {
          await appStore.updateProfile({
            name: user.name,
            ...(user.avatar ? { avatar: user.avatar } : {}),
          });
        } catch (err) {
          console.error('Failed to sync profile on Google login:', err);
        }

        (req.session as any).tokens = tokens;

        res.send(`
          <html>
            <body>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'GOOGLE_LOGIN_SUCCESS' }, '${appUrl}');
                  window.close();
                } else {
                  window.location.href = '/';
                }
              </script>
              <p>Login successful. This window should close automatically.</p>
            </body>
          </html>
        `);
      } else {
        (req.session as any).tokens = tokens;

        res.send(`
          <html>
            <body>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '${appUrl}');
                  window.close();
                } else {
                  window.location.href = '/';
                }
              </script>
              <p>Authentication successful. This window should close automatically.</p>
            </body>
          </html>
        `);
      }
    } catch (error) {
      console.error('Error retrieving access token', error);
      res.status(500).send('Authentication failed');
    }
  });

  // ── Calendar auth status ──────────────────────────────────────

  router.get('/status', (req, res) => {
    const response: AuthStatusResponse = {
      connected: Boolean((req.session as any).tokens),
    };
    res.json(response);
  });

  return router;
}
