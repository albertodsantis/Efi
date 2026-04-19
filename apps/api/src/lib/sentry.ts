import * as Sentry from '@sentry/node';

let initialized = false;

export function initSentry() {
  if (initialized) return;
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    sendDefaultPii: false,
    tracesSampleRate: 0,
    ignoreErrors: [
      /ECONNRESET/,
      /EPIPE/,
      /socket hang up/i,
    ],
  });

  initialized = true;
}

export { Sentry };
