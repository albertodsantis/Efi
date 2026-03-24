import { build } from 'esbuild';
import { cpSync, mkdirSync } from 'fs';
import { join } from 'path';

build({
  entryPoints: ['apps/api/src/server.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: 'apps/api/dist/server.cjs',
  format: 'cjs',
  external: [
    'dotenv',
    'express',
    'express-session',
    'googleapis',
    'vite',
    'pg',
    'connect-pg-simple',
  ],
}).then(() => {
  // Copy SQL migration files to dist
  const src = join('apps', 'api', 'src', 'db', 'migrations');
  const dest = join('apps', 'api', 'dist', 'db', 'migrations');
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
  console.log('Migration files copied to dist.');
}).catch(() => process.exit(1));
