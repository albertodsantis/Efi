import { build } from 'esbuild';

build({
  entryPoints: ['apps/api/src/server.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: 'apps/api/dist/server.cjs',
  format: 'cjs',
  external: ['dotenv', 'express', 'express-session', 'googleapis', 'vite'],
}).catch(() => process.exit(1));
