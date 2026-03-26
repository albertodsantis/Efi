/**
 * Vercel Serverless Function entry point.
 * Wraps the Express app for serverless execution.
 */
let handler;

module.exports = async (req, res) => {
  if (!handler) {
    const { createApp } = require('../apps/api/dist/app.cjs');
    const { app } = await createApp();
    handler = app;
  }
  return handler(req, res);
};
