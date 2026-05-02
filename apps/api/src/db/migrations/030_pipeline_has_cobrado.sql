-- Toggle that lets each user opt out of the "Cobrado" stage in the pipeline.
-- When false, the app treats "Completada" as the terminal stage and any task in
-- "Cobrado" is migrated to "Completada" by the client before the toggle flips.
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS pipeline_has_cobrado BOOLEAN NOT NULL DEFAULT true;
