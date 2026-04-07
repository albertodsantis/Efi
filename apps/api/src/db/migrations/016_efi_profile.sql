-- Add efi_profile column for the new linktree-style profile system.
-- media_kit column is kept temporarily for safe rollback; drop in a future migration.
ALTER TABLE user_profile
  ADD COLUMN IF NOT EXISTS efi_profile  JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tagline      TEXT  NOT NULL DEFAULT '';
