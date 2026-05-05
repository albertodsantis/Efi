-- ============================================================
-- USER LOCALE
-- Adds a per-user UI language preference. Existing rows default
-- to 'es' to preserve current behavior. Allowed values: 'es', 'en'.
-- ============================================================
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'es';

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_locale_check;

ALTER TABLE users
  ADD CONSTRAINT users_locale_check CHECK (locale IN ('es','en'));
