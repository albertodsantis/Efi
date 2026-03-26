import { build } from 'esbuild';
import { cpSync, mkdirSync } from 'fs';
import { join } from 'path';

const shared = {
  bundle: true,
  platform: 'node' as const,
  target: 'node20',
  format: 'cjs' as const,
  external: [
    'dotenv',
    'express',
    'express-session',
    'googleapis',
    'vite',
    'pg',
    'connect-pg-simple',
    'helmet',
    'express-rate-limit',
    'bcryptjs',
    'multer',
    '@supabase/supabase-js',
    '@google/genai',
  ],
};

Promise.all([
  // Standalone server (Railway / Render / local production)
  build({
    ...shared,
    entryPoints: ['apps/api/src/server.ts'],
    outfile: 'apps/api/dist/server.cjs',
  }),
  // App factory (Vercel serverless)
  build({
    ...shared,
    entryPoints: ['apps/api/src/app.ts'],
    outfile: 'apps/api/dist/app.cjs',
  }),
]).then(() => {
  // Copy SQL migration files to dist
  const src = join('apps', 'api', 'src', 'db', 'migrations');
  const dest = join('apps', 'api', 'dist', 'db', 'migrations');
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
  console.log('Build complete. Migration files copied to dist.');
}).catch(() => process.exit(1));
