-- Enforce unique handles (case-insensitive) for public profile URLs.
-- Excludes empty handles so new users without a handle don't conflict.
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profile_handle_unique
  ON user_profile (LOWER(handle))
  WHERE handle <> '';
