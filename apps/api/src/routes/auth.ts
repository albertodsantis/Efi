import { Router } from 'express';
import type { AuthStatusResponse, GoogleAuthUrlResponse, LogoutResponse } from '@shared';

type OAuthClient = {
  generateAuthUrl: (options: {
    access_type: string;
    scope: string[];
    prompt: string;
  }) => string;
  getToken: (code: string) => Promise<{ tokens: unknown }>;
};

export function createAuthRouter(oauth2Client: OAuthClient) {
  const router = Router();

  router.get('/google/url', (_req, res) => {
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.readonly',
      ],
      prompt: 'consent',
    });

    const response: GoogleAuthUrlResponse = { url };
    res.json(response);
  });

  router.get('/google/callback', async (req, res) => {
    const { code } = req.query;

    try {
      const { tokens } = await oauth2Client.getToken(code as string);
      (req.session as any).tokens = tokens;

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Error retrieving access token', error);
      res.status(500).send('Authentication failed');
    }
  });

  router.get('/status', (req, res) => {
    const response: AuthStatusResponse = {
      connected: Boolean((req.session as any).tokens),
    };

    res.json(response);
  });

  router.post('/logout', (req, res) => {
    (req.session as any).tokens = null;

    const response: LogoutResponse = { success: true };
    res.json(response);
  });

  return router;
}
