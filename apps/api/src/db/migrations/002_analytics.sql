-- ============================================================
-- TASK: new analytics columns
-- ============================================================
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at   TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS cobrado_at     TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_payment NUMERIC(12,2);

-- ============================================================
-- PARTNER: new analytics columns
-- ============================================================
ALTER TABLE partners ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS source            TEXT NOT NULL DEFAULT '';

-- ============================================================
-- TASK STATUS HISTORY
-- ============================================================
CREATE TABLE task_status_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status   TEXT NOT NULL,
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_task_status_history_task_id    ON task_status_history (task_id);
CREATE INDEX idx_task_status_history_changed_at ON task_status_history (changed_at);

-- ============================================================
-- PARTNER STATUS HISTORY
-- ============================================================
CREATE TABLE partner_status_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id  UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status   TEXT NOT NULL,
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_partner_status_history_partner_id ON partner_status_history (partner_id);
CREATE INDEX idx_partner_status_history_changed_at ON partner_status_history (changed_at);

-- ============================================================
-- Backfill: insert initial transition for existing rows
-- ============================================================
INSERT INTO task_status_history (task_id, from_status, to_status, changed_at)
SELECT id, NULL, status, created_at FROM tasks
ON CONFLICT DO NOTHING;

INSERT INTO partner_status_history (partner_id, from_status, to_status, changed_at)
SELECT id, NULL, status, created_at FROM partners
ON CONFLICT DO NOTHING;
