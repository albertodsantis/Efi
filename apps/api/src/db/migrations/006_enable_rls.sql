-- Enable Row-Level Security on all tables.
-- The backend connects as the postgres superuser which bypasses RLS,
-- so no policies are needed — this just blocks the public Supabase Data API.

ALTER TABLE "session"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners               ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts               ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates              ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profile           ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_status_history    ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                  ENABLE ROW LEVEL SECURITY;
