import path from 'path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createApp } from './app';

const repoRoot = process.cwd();
const webRoot = path.join(repoRoot, 'apps', 'web');
const webDistPath = path.join(webRoot, 'dist');

async function startServer() {
  const { app, env, closePool } = await createApp();

  // Frontend serving
  if (env.NODE_ENV !== 'production') {
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

  const server = app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${env.PORT}`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down...');
    server.close();
    await closePool();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
