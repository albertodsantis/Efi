-- ============================================================
-- SUBSCRIPTION PLANS
-- All existing users are grandfathered as 'pro' with no expiry.
-- Gating is bypassed while EARLY_ACCESS=true in env; when that
-- flag is turned off, a follow-up script sets trial_ends_at for
-- existing users (e.g. NOW() + 30 days).
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'pro';
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscribed_until TIMESTAMPTZ;
