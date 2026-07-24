-- GetMeCare Database Schema — run this in your Supabase SQL Editor
-- Covers M2 (matching), M3 (bids / shifts / billing), M4 (notifications)

-- ── Extend profiles ───────────────────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS psw_role TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS languages TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cities TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS care_types TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_payment_method_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 5.0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- ── Drop FK constraints that block inserts ────────────────────────────────────
ALTER TABLE jobs    DROP CONSTRAINT IF EXISTS jobs_family_id_fkey;
ALTER TABLE bids    DROP CONSTRAINT IF EXISTS bids_caregiver_id_fkey;
ALTER TABLE shifts  DROP CONSTRAINT IF EXISTS shifts_caregiver_id_fkey;
ALTER TABLE shifts  DROP CONSTRAINT IF EXISTS shifts_family_id_fkey;

-- ── Jobs ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jobs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id      UUID,
  title          TEXT NOT NULL,
  city           TEXT,
  postal_prefix  TEXT,
  care_type      TEXT DEFAULT 'PSW',
  hours          TEXT,
  schedule       TEXT,
  rate           NUMERIC,
  status         TEXT DEFAULT 'open',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;

-- ── Bids ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bids (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          UUID REFERENCES jobs(id) ON DELETE CASCADE,
  caregiver_id    UUID,
  amount          NUMERIC NOT NULL,
  note            TEXT,
  status          TEXT DEFAULT 'pending',
  counter_amount  NUMERIC,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE bids DISABLE ROW LEVEL SECURITY;

-- ── Shifts ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shifts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id            UUID REFERENCES jobs(id),
  caregiver_id      UUID,
  family_id         UUID,
  clock_in          TIMESTAMPTZ,
  clock_out         TIMESTAMPTZ,
  hours_worked      NUMERIC,
  rate              NUMERIC,
  gross             NUMERIC,
  platform_fee      NUMERIC,
  net               NUMERIC,
  status            TEXT DEFAULT 'active',
  stripe_charge_id  TEXT,
  stripe_status     TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE shifts DISABLE ROW LEVEL SECURITY;

-- ── M4: Notifications ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  message     TEXT,
  data        JSONB DEFAULT '{}',
  read        BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "users read own notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "users update own notifications"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_role         ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_verified     ON profiles(verified);
CREATE INDEX IF NOT EXISTS idx_profiles_postal       ON profiles(postal_code);
CREATE INDEX IF NOT EXISTS idx_jobs_status           ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_city             ON jobs(city);
CREATE INDEX IF NOT EXISTS idx_bids_job_id           ON bids(job_id);
CREATE INDEX IF NOT EXISTS idx_bids_caregiver_id     ON bids(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_shifts_caregiver_id   ON shifts(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_shifts_family_id      ON shifts(family_id);
CREATE INDEX IF NOT EXISTS idx_notifs_user_id        ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifs_created        ON notifications(created_at DESC);
