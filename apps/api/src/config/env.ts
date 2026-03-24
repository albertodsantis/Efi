export interface AppEnv {
  DATABASE_URL: string;
  SESSION_SECRET: string;
  APP_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  PORT: number;
  NODE_ENV: 'development' | 'production';
  GEMINI_API_KEY?: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
      'Check your .env file or environment configuration.',
    );
  }
  return value;
}

function warnIfMissing(name: string): string {
  const value = process.env[name] || '';
  if (!value) {
    console.warn(`Warning: ${name} is not set. Google Calendar integration will not work.`);
  }
  return value;
}

export function loadEnv(): AppEnv {
  return {
    DATABASE_URL: requireEnv('DATABASE_URL'),
    SESSION_SECRET: requireEnv('SESSION_SECRET'),
    APP_URL: requireEnv('APP_URL'),
    GOOGLE_CLIENT_ID: warnIfMissing('GOOGLE_CLIENT_ID'),
    GOOGLE_CLIENT_SECRET: warnIfMissing('GOOGLE_CLIENT_SECRET'),
    PORT: Number(process.env.PORT || 3000),
    NODE_ENV: (process.env.NODE_ENV === 'production' ? 'production' : 'development'),
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || undefined,
  };
}
