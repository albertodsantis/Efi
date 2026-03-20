import dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import { google } from 'googleapis';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createAuthRouter } from './routes/auth';
import { createCalendarRouter } from './routes/calendar';
import { createV1Router } from './routes/v1';

const repoRoot = process.cwd();
const webRoot = path.join(repoRoot, 'apps', 'web');
const webDistPath = path.join(webRoot, 'dist');

dotenv.config({ path: path.join(repoRoot, '.env') });

const port = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

const app = express();

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'super-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      httpOnly: true,
    },
  }),
);

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.APP_URL}/api/auth/google/callback`,
);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/v1', createV1Router());
app.use('/api/auth', createAuthRouter(oauth2Client));
app.use('/api/calendar', createCalendarRouter(oauth2Client));

async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      root: webRoot,
      configFile: path.join(webRoot, 'vite.config.ts'),
      server: { middlewareMode: true },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    app.use(express.static(webDistPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(webDistPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });
}

startServer();
