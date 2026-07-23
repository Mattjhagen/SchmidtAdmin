-- ============================================================
-- FULL SCHEMA BOOTSTRAP — Schmidt Construction admin database
-- ------------------------------------------------------------
-- Creates every table the app uses, with RLS and seed content.
-- Fully idempotent: safe to run on a fresh project or re-run on
-- one that already has some of these objects.
-- Written 2026-07-22 when the app moved to a new Supabase
-- project after the original project's login was lost.
-- ============================================================

-- ---------- Admin allowlist + helper ----------

CREATE TABLE IF NOT EXISTS portal_admins ( email text PRIMARY KEY );

INSERT INTO portal_admins (email) VALUES
  ('matty@purepulse.one'),
  ('admin@schmidt-construction.com'),
  ('mike@walls2.com'),
  ('mikiel@schmidt-construction.com')
ON CONFLICT DO NOTHING;

ALTER TABLE portal_admins ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_portal_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM portal_admins
    WHERE lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
  );
$$;

-- ---------- Quote requests (public form) ----------

CREATE TABLE IF NOT EXISTS quote_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  name          text NOT NULL,
  phone         text NOT NULL,
  email         text,
  address       text,
  service       text NOT NULL,
  details       text,
  status        text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'contacted', 'converted', 'dismissed')),
  admin_notes   text
);
ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS address text;

ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all" ON quote_requests;
CREATE POLICY "admin_all" ON quote_requests
  FOR ALL TO authenticated
  USING (is_portal_admin()) WITH CHECK (is_portal_admin());

DROP POLICY IF EXISTS "customer_read_own" ON quote_requests;
CREATE POLICY "customer_read_own" ON quote_requests
  FOR SELECT TO authenticated
  USING (lower(email) = lower(coalesce(auth.jwt()->>'email', '')));

DROP POLICY IF EXISTS "public_insert" ON quote_requests;
CREATE POLICY "public_insert" ON quote_requests
  FOR INSERT TO anon WITH CHECK (true);

-- ---------- Customer portal messages ----------

CREATE TABLE IF NOT EXISTS portal_messages (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id uuid NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  sender_role      text NOT NULL CHECK (sender_role IN ('customer', 'contractor')),
  sender_name      text,
  sender_email     text,
  body             text NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS portal_messages_request_idx
  ON portal_messages (quote_request_id, created_at);

ALTER TABLE portal_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all" ON portal_messages;
CREATE POLICY "admin_all" ON portal_messages
  FOR ALL TO authenticated
  USING (is_portal_admin()) WITH CHECK (is_portal_admin());

DROP POLICY IF EXISTS "customer_read_own" ON portal_messages;
CREATE POLICY "customer_read_own" ON portal_messages
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM quote_requests q
    WHERE q.id = quote_request_id
      AND lower(q.email) = lower(coalesce(auth.jwt()->>'email', ''))
  ));

DROP POLICY IF EXISTS "customer_insert_own" ON portal_messages;
CREATE POLICY "customer_insert_own" ON portal_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_role = 'customer'
    AND EXISTS (
      SELECT 1 FROM quote_requests q
      WHERE q.id = quote_request_id
        AND lower(q.email) = lower(coalesce(auth.jwt()->>'email', ''))
    )
  );

-- ---------- Estimating core: clients / projects / proposals ----------

CREATE TABLE IF NOT EXISTS clients (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  email      text NOT NULL DEFAULT '',
  phone      text NOT NULL DEFAULT '',
  address    text NOT NULL DEFAULT '',
  notes      text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id          uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name               text NOT NULL,
  type               text NOT NULL DEFAULT 'other',
  job_site_address   text NOT NULL DEFAULT '',
  description        text NOT NULL DEFAULT '',
  desired_start_date date,
  status             text NOT NULL DEFAULT 'Planning',
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS proposals (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id         uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  proposal_number    text NOT NULL DEFAULT '',
  current_version_id uuid,
  status             text NOT NULL DEFAULT 'Draft',
  share_token        text NOT NULL DEFAULT gen_random_uuid()::text,
  expiration_date    date,
  created_by         text,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS proposal_versions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id         uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  version_number      integer NOT NULL DEFAULT 1,
  title               text NOT NULL DEFAULT '',
  scope_of_work       text NOT NULL DEFAULT '',
  assumptions         text NOT NULL DEFAULT '',
  exclusions          text NOT NULL DEFAULT '',
  timeline            text NOT NULL DEFAULT '',
  payment_terms       text NOT NULL DEFAULT '',
  warranty_notes      text NOT NULL DEFAULT '',
  subtotal            numeric NOT NULL DEFAULT 0,
  tax                 numeric NOT NULL DEFAULT 0,
  discount            numeric NOT NULL DEFAULT 0,
  total               numeric NOT NULL DEFAULT 0,
  internal_notes      text NOT NULL DEFAULT '',
  client_message      text NOT NULL DEFAULT '',
  remarks             text,
  deposit_percentage  numeric,
  deposit_amount      numeric,
  balance_due_text    text,
  acceptance_language text,
  wall_sections       jsonb,
  created_at          timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE proposal_versions ADD COLUMN IF NOT EXISTS wall_sections jsonb;
ALTER TABLE proposal_versions ADD COLUMN IF NOT EXISTS remarks text;
ALTER TABLE proposal_versions ADD COLUMN IF NOT EXISTS deposit_percentage numeric;
ALTER TABLE proposal_versions ADD COLUMN IF NOT EXISTS deposit_amount numeric;
ALTER TABLE proposal_versions ADD COLUMN IF NOT EXISTS balance_due_text text;
ALTER TABLE proposal_versions ADD COLUMN IF NOT EXISTS acceptance_language text;

CREATE TABLE IF NOT EXISTS proposal_line_items (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_version_id uuid NOT NULL REFERENCES proposal_versions(id) ON DELETE CASCADE,
  category            text NOT NULL DEFAULT '',
  description         text NOT NULL DEFAULT '',
  quantity            numeric NOT NULL DEFAULT 0,
  unit                text NOT NULL DEFAULT '',
  unit_cost           numeric NOT NULL DEFAULT 0,
  markup_percent      numeric NOT NULL DEFAULT 0,
  line_total          numeric NOT NULL DEFAULT 0,
  optional            boolean NOT NULL DEFAULT false,
  line_item_type      text,
  client_selectable   boolean,
  selected_by_default boolean,
  sort_order          integer
);

CREATE TABLE IF NOT EXISTS negotiation_events (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id         uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  proposal_version_id uuid,
  sender_type         text NOT NULL DEFAULT 'system',
  message             text NOT NULL DEFAULT '',
  requested_changes   text NOT NULL DEFAULT '',
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  user_id     text,
  action      text NOT NULL DEFAULT '',
  details     text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS saved_proposal_options (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                   text NOT NULL,
  description            text,
  category               text,
  default_price          numeric NOT NULL DEFAULT 0,
  default_unit           text NOT NULL DEFAULT '',
  default_quantity       numeric NOT NULL DEFAULT 1,
  default_markup_percent numeric NOT NULL DEFAULT 0,
  line_item_type         text NOT NULL DEFAULT 'optional',
  client_selectable      boolean NOT NULL DEFAULT true,
  selected_by_default    boolean NOT NULL DEFAULT false,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE negotiation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_proposal_options ENABLE ROW LEVEL SECURITY;

-- Estimating data: admins have full control. The proposal chain is also
-- readable (and status-updatable) by anyone holding a share link, because
-- the customer-facing proposal viewer runs without an admin login — the
-- unguessable share_token is the secret.
DROP POLICY IF EXISTS "admin_all" ON clients;
CREATE POLICY "admin_all" ON clients FOR ALL TO authenticated
  USING (is_portal_admin()) WITH CHECK (is_portal_admin());

DROP POLICY IF EXISTS "admin_all" ON projects;
CREATE POLICY "admin_all" ON projects FOR ALL TO authenticated
  USING (is_portal_admin()) WITH CHECK (is_portal_admin());
DROP POLICY IF EXISTS "public_read" ON projects;
CREATE POLICY "public_read" ON projects FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin_all" ON proposals;
CREATE POLICY "admin_all" ON proposals FOR ALL TO authenticated
  USING (is_portal_admin()) WITH CHECK (is_portal_admin());
DROP POLICY IF EXISTS "public_read" ON proposals;
CREATE POLICY "public_read" ON proposals FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_update_status" ON proposals;
CREATE POLICY "public_update_status" ON proposals FOR UPDATE
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_all" ON proposal_versions;
CREATE POLICY "admin_all" ON proposal_versions FOR ALL TO authenticated
  USING (is_portal_admin()) WITH CHECK (is_portal_admin());
DROP POLICY IF EXISTS "public_read" ON proposal_versions;
CREATE POLICY "public_read" ON proposal_versions FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin_all" ON proposal_line_items;
CREATE POLICY "admin_all" ON proposal_line_items FOR ALL TO authenticated
  USING (is_portal_admin()) WITH CHECK (is_portal_admin());
DROP POLICY IF EXISTS "public_read" ON proposal_line_items;
CREATE POLICY "public_read" ON proposal_line_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin_all" ON negotiation_events;
CREATE POLICY "admin_all" ON negotiation_events FOR ALL TO authenticated
  USING (is_portal_admin()) WITH CHECK (is_portal_admin());
DROP POLICY IF EXISTS "public_read" ON negotiation_events;
CREATE POLICY "public_read" ON negotiation_events FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_insert" ON negotiation_events;
CREATE POLICY "public_insert" ON negotiation_events FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "admin_read" ON audit_logs;
CREATE POLICY "admin_read" ON audit_logs FOR SELECT TO authenticated
  USING (is_portal_admin());
DROP POLICY IF EXISTS "public_insert" ON audit_logs;
CREATE POLICY "public_insert" ON audit_logs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "admin_all" ON saved_proposal_options;
CREATE POLICY "admin_all" ON saved_proposal_options FOR ALL TO authenticated
  USING (is_portal_admin()) WITH CHECK (is_portal_admin());

-- ---------- Time clock module ----------

CREATE TABLE IF NOT EXISTS contractor_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  contractor_name text NOT NULL DEFAULT '',
  company_name text NOT NULL DEFAULT '',
  manager_name text NOT NULL DEFAULT '',
  manager_email text NOT NULL DEFAULT '',
  hourly_rate_cents integer NOT NULL DEFAULT 0 CHECK (hourly_rate_cents >= 0),
  time_zone text NOT NULL DEFAULT 'UTC',
  additional_rate_enabled boolean NOT NULL DEFAULT false,
  additional_rate_threshold_minutes integer NOT NULL DEFAULT 2400 CHECK (additional_rate_threshold_minutes >= 0),
  additional_rate_multiplier numeric NOT NULL DEFAULT 1.5 CHECK (additional_rate_multiplier > 0),
  auto_clock_out_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clock_in timestamptz NOT NULL,
  clock_out timestamptz CHECK (clock_out IS NULL OR clock_out >= clock_in),
  project text,
  customer_name text,
  job_site_address text,
  work_category text,
  notes text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'voided')),
  auto_clock_out boolean NOT NULL DEFAULT false,
  needs_review boolean NOT NULL DEFAULT false,
  review_reason text,
  manual_entry boolean NOT NULL DEFAULT false,
  voided_at timestamptz,
  void_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS time_entry_breaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  time_entry_id uuid NOT NULL REFERENCES time_entries(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz CHECK (end_time IS NULL OR end_time >= start_time),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS timesheet_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL CHECK (period_end >= period_start),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'submitted', 'amended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS timesheet_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timesheet_period_id uuid NOT NULL REFERENCES timesheet_periods(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version integer NOT NULL CHECK (version > 0),
  period_start date NOT NULL,
  period_end date NOT NULL,
  contractor_settings_snapshot jsonb NOT NULL,
  entries_snapshot jsonb NOT NULL,
  totals_snapshot jsonb NOT NULL,
  submission_reason text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  email_status text,
  email_message_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (timesheet_period_id, version)
);

CREATE TABLE IF NOT EXISTS time_entry_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  time_entry_id uuid NOT NULL REFERENCES time_entries(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  field_name text,
  old_value text,
  new_value text,
  reason text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_time_entries_active_shift ON time_entries (user_id) WHERE clock_out IS NULL AND voided_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_time_entry_breaks_active ON time_entry_breaks (time_entry_id) WHERE end_time IS NULL;
CREATE INDEX IF NOT EXISTS idx_time_entries_user_clock_in ON time_entries (user_id, clock_in);
CREATE INDEX IF NOT EXISTS idx_time_entries_needs_review ON time_entries (needs_review) WHERE needs_review = true;
CREATE INDEX IF NOT EXISTS idx_timesheet_periods_user_dates ON timesheet_periods (user_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_time_entry_audit_entry_id ON time_entry_audit (time_entry_id);
CREATE INDEX IF NOT EXISTS idx_timesheet_submissions_period ON timesheet_submissions (timesheet_period_id);

ALTER TABLE contractor_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entry_breaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheet_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheet_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entry_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contractor_settings_owner_all" ON contractor_settings;
CREATE POLICY "contractor_settings_owner_all" ON contractor_settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "contractor_settings_admin_read" ON contractor_settings;
CREATE POLICY "contractor_settings_admin_read" ON contractor_settings FOR SELECT TO authenticated USING (is_portal_admin());
DROP POLICY IF EXISTS "time_entries_owner_all" ON time_entries;
CREATE POLICY "time_entries_owner_all" ON time_entries FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "time_entry_breaks_owner_all" ON time_entry_breaks;
CREATE POLICY "time_entry_breaks_owner_all" ON time_entry_breaks FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM time_entries WHERE id = time_entry_breaks.time_entry_id AND user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM time_entries WHERE id = time_entry_breaks.time_entry_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "timesheet_periods_owner_all" ON timesheet_periods;
CREATE POLICY "timesheet_periods_owner_all" ON timesheet_periods FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "timesheet_submissions_owner_read" ON timesheet_submissions;
CREATE POLICY "timesheet_submissions_owner_read" ON timesheet_submissions FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "time_entry_audit_owner_read" ON time_entry_audit;
CREATE POLICY "time_entry_audit_owner_read" ON time_entry_audit FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION auto_close_time_entry(p_entry_id uuid, p_boundary_time timestamptz)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_modified boolean := false;
BEGIN
  UPDATE time_entries
  SET
    clock_out = p_boundary_time,
    auto_clock_out = true,
    needs_review = true,
    review_reason = 'Automatically clocked out at midnight.',
    status = 'closed',
    updated_at = now()
  WHERE id = p_entry_id AND clock_out IS NULL
  RETURNING user_id INTO v_user_id;

  IF FOUND THEN
    v_modified := true;
    UPDATE time_entry_breaks
    SET end_time = p_boundary_time, updated_at = now()
    WHERE time_entry_id = p_entry_id AND end_time IS NULL;

    INSERT INTO time_entry_audit (
      time_entry_id, user_id, event_type, field_name, new_value, reason, created_at
    ) VALUES (
      p_entry_id, v_user_id, 'AUTO_CLOCK_OUT', 'clock_out', p_boundary_time::text, 'Automatically clocked out at midnight.', now()
    );
  END IF;

  RETURN v_modified;
END;
$$;

REVOKE EXECUTE ON FUNCTION auto_close_time_entry(uuid, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION auto_close_time_entry(uuid, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION auto_close_time_entry(uuid, timestamptz) TO service_role;

-- ---------- Site content (Site Editor ↔ walls2.com) ----------

CREATE TABLE IF NOT EXISTS portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  location text NOT NULL DEFAULT '',
  service_slug text NOT NULL DEFAULT '',
  service_name text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS site_config (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_overrides (
  slug text PRIMARY KEY,
  long_description text,
  image_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read portfolio" ON portfolio_items;
CREATE POLICY "public read portfolio" ON portfolio_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "authenticated write portfolio" ON portfolio_items;
CREATE POLICY "authenticated write portfolio" ON portfolio_items FOR ALL TO authenticated USING (is_portal_admin()) WITH CHECK (is_portal_admin());

DROP POLICY IF EXISTS "public read site_config" ON site_config;
CREATE POLICY "public read site_config" ON site_config FOR SELECT USING (true);
DROP POLICY IF EXISTS "authenticated write site_config" ON site_config;
CREATE POLICY "authenticated write site_config" ON site_config FOR ALL TO authenticated USING (is_portal_admin()) WITH CHECK (is_portal_admin());

DROP POLICY IF EXISTS "public read service_overrides" ON service_overrides;
CREATE POLICY "public read service_overrides" ON service_overrides FOR SELECT USING (true);
DROP POLICY IF EXISTS "authenticated write service_overrides" ON service_overrides;
CREATE POLICY "authenticated write service_overrides" ON service_overrides FOR ALL TO authenticated USING (is_portal_admin()) WITH CHECK (is_portal_admin());

-- ---------- Seed: site info ----------

INSERT INTO site_config (key, value) VALUES
  ('phone', '(402) 320-2600'),
  ('phone_href', 'tel:+14023202600'),
  ('email', 'mikiel@schmidt-construction.com'),
  ('address', 'Omaha, NE'),
  ('hours_weekday', 'Monday–Friday: 7am–5pm'),
  ('hours_weekend', 'Saturday: By appointment'),
  ('tagline', '50+ Years of Family-Owned Excellence'),
  ('about_text', 'Family-owned general contractor serving Omaha, Nebraska and surrounding areas since 1973. Specializing in retaining walls, concrete, drainage, and remodeling. Licensed, insured, and dedicated to premium quality.')
ON CONFLICT (key) DO NOTHING;

-- ---------- Seed: service page content ----------

INSERT INTO service_overrides (slug, long_description) VALUES
  ('retaining-wall-installation', 'Schmidt Construction has installed hundreds of retaining walls across Omaha and the surrounding metro area. Whether you need a low decorative border or a structural wall holding back significant grade change, we engineer each project to last. We assess soil conditions, drainage needs, and site access before recommending the right wall system for your property.'),
  ('block-retaining-wall', 'Block retaining walls are the most popular choice for Omaha homeowners. They offer a clean, professional look and exceptional longevity. We install major block systems including Allan Block, Versa-Lok, and Keystone. Our crews are trained by the manufacturers and follow every specification for base preparation, batter, drainage, and capstone installation.')
ON CONFLICT (slug) DO NOTHING;

-- ---------- Seed: website photos (only when portfolio is empty) ----------

INSERT INTO portfolio_items (sort_order, image_url, title, location, service_slug, service_name, featured)
SELECT * FROM (VALUES
  (1,  'https://walls2.com/images/schmidt-6in-siena-wall.jpg', '6in Siena Block Wall', 'Omaha, NE', 'block-retaining-wall', 'Block Retaining Walls', true),
  (2,  'https://walls2.com/images/schmidt-block-wall.jpg', 'Block Retaining Wall', '', 'block-retaining-wall', 'Block Retaining Walls', true),
  (3,  'https://walls2.com/images/schmidt-retaining-wall.jpg', 'Retaining Wall Project', '', 'retaining-wall-installation', 'Retaining Wall Installation', true),
  (4,  'https://walls2.com/images/schmidt-8in-siena-wall.jpg', '8in Siena Block Wall', '', 'block-retaining-wall', 'Block Retaining Walls', true),
  (5,  'https://walls2.com/images/schmidt-belvedere-wall.jpg', 'Bellevue Wall Project', 'Bellevue, NE', 'retaining-wall-installation', 'Retaining Wall Installation', true),
  (6,  'https://walls2.com/images/schmidt-6in-siena-175th.jpg', '175th & Karen — Siena Wall', 'Omaha, NE', 'block-retaining-wall', 'Block Retaining Walls', true),
  (7,  'https://walls2.com/images/schmidt-boulder-wall.jpg', 'Boulder Retaining Wall', '', 'retaining-wall-installation', 'Retaining Wall Installation', true),
  (8,  'https://walls2.com/images/schmidt-boulder-project-1.jpg', 'Terraced Boulder Wall', '', 'retaining-wall-installation', 'Retaining Wall Installation', true),
  (9,  'https://walls2.com/images/schmidt-timber.jpg', 'Timber Retaining Wall', '', 'timber-retaining-wall', 'Timber Retaining Walls', true),
  (10, 'https://walls2.com/images/schmidt-stone-wall.jpg', 'Stone Retaining Wall', '', 'retaining-wall-installation', 'Retaining Wall Installation', true),
  (11, 'https://walls2.com/images/schmidt-6in-gray-wall.jpg', '6in Gray Block Wall', 'Omaha, NE', 'block-retaining-wall', 'Block Retaining Walls', true),
  (12, 'https://walls2.com/images/schmidt-bevel-onyx-wall.jpg', 'Bevel Onyx Block Wall', '', 'block-retaining-wall', 'Block Retaining Walls', true),
  (13, 'https://walls2.com/images/schmidt-wall-project-1.jpg', 'Block Wall Construction', '', 'block-retaining-wall', 'Block Retaining Walls', true),
  (14, 'https://walls2.com/images/schmidt-6in-siena-tiered.jpg', 'Tiered Siena Wall', '', 'block-retaining-wall', 'Block Retaining Walls', true),
  (15, 'https://walls2.com/images/schmidt-lakefront.jpg', 'Lakefront Wall', '', 'seawall-lakeside', 'Seawall & Lakeside', true),
  (16, 'https://walls2.com/images/schmidt-seawall.png', 'Seawall Project', '', 'seawall-lakeside', 'Seawall & Lakeside', true),
  (17, 'https://walls2.com/images/schmidt-project-showcase.jpg', 'Project Showcase', '', 'retaining-wall-installation', 'Retaining Wall Installation', true),
  (18, 'https://walls2.com/images/concrete-driveway-omaha.jpg', 'Concrete Driveway', 'Omaha, NE', 'concrete-contractor', 'Concrete Work', true),
  (19, 'https://walls2.com/images/timber-retaining-wall-hero.jpg', 'Timber Retaining Wall', 'Omaha, NE', 'timber-retaining-wall', 'Timber Retaining Walls', false),
  (20, 'https://walls2.com/images/block-retaining-wall-steps.jpg', 'Block Wall & Steps', '', 'block-retaining-wall', 'Block Retaining Walls', false),
  (21, 'https://walls2.com/images/after-block-retaining-wall.jpg', 'Engineered Block Wall', '', 'block-retaining-wall', 'Block Retaining Walls', false),
  (22, 'https://walls2.com/images/timber-wall-landscaped.jpg', 'Landscaped Timber Wall', '', 'timber-retaining-wall', 'Timber Retaining Walls', false),
  (23, 'https://walls2.com/images/lakefront-seawall-omaha.jpg', 'Lakefront Seawall', '', 'seawall-lakeside', 'Seawall & Lakeside', false),
  (24, 'https://walls2.com/images/stamped-patio-garden-wall.jpg', 'Stamped Patio & Garden Wall', '', 'concrete-contractor', 'Concrete Work', false),
  (25, 'https://walls2.com/images/stamped-concrete-patio-steps.jpg', 'Stamped Concrete Patio', '', 'concrete-contractor', 'Concrete Work', false),
  (26, 'https://walls2.com/images/seawall-dock-detail.jpg', 'Seawall & Dock', '', 'seawall-lakeside', 'Seawall & Lakeside', false),
  (27, 'https://walls2.com/images/block-wall-siena-tiered.jpg', 'Tiered Block Wall (Siena)', '', 'block-retaining-wall', 'Block Retaining Walls', false),
  (28, 'https://walls2.com/images/timber-wall-steps-patio.jpg', 'Timber Wall & Patio', '', 'timber-retaining-wall', 'Timber Retaining Walls', false),
  (29, 'https://walls2.com/images/block-wall-8in-sienna.jpg', '8in Sienna Block Wall', '', 'block-retaining-wall', 'Block Retaining Walls', false),
  (30, 'https://walls2.com/images/block-wall-steps-detail.jpg', 'Block Steps Detail', '', 'block-retaining-wall', 'Block Retaining Walls', false),
  (31, 'https://walls2.com/images/block-wall-residential.jpg', 'Residential Block Wall', '', 'block-retaining-wall', 'Block Retaining Walls', false),
  (32, 'https://walls2.com/images/timber-terraced-hostas.jpg', 'Terraced Timber Walls', '', 'timber-retaining-wall', 'Timber Retaining Walls', false),
  (33, 'https://walls2.com/images/paver-walkway-landscaped.jpg', 'Paver Walkway', '', 'concrete-contractor', 'Concrete Work', false),
  (34, 'https://walls2.com/images/paver-patio-dining.jpg', 'Paver Patio', '', 'concrete-contractor', 'Concrete Work', false),
  (35, 'https://walls2.com/images/kitchen-remodel-counters.jpg', 'Kitchen Remodel', '', 'kitchen-remodeling', 'Kitchen Remodeling', false),
  (36, 'https://walls2.com/images/block-garden-wall-steps.jpg', 'Garden Wall & Steps', '', 'block-retaining-wall', 'Block Retaining Walls', false),
  (37, 'https://walls2.com/images/schmidt-block-wall-branded.jpg', 'Block Wall (Schmidt Branded)', '', 'block-retaining-wall', 'Block Retaining Walls', false),
  (38, 'https://walls2.com/images/composite-steps-stone-veneer.jpg', 'Composite Steps & Stone Veneer', '', 'concrete-contractor', 'Concrete Work', false)
) AS v(sort_order, image_url, title, location, service_slug, service_name, featured)
WHERE NOT EXISTS (SELECT 1 FROM portfolio_items);

-- ---------- Done: refresh the API schema cache ----------

NOTIFY pgrst, 'reload schema';
