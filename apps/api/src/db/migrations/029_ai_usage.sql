-- ============================================================
-- AI USAGE
-- Tracks Efi IA message count per user per rolling monthly window.
-- One row per user per period (period_start = first day of UTC month).
-- Quota is enforced at the route level; this table is the source of truth.
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_usage (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  message_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, period_start)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_usage(user_id);
