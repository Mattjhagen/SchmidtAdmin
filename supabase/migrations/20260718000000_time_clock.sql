-- Migration: 20260718000000_time_clock.sql
-- Description: Creates Time Clock & Contractor Earnings Module tables, RLS, constraints, indexes, and atomic RPC.

-- 1. Tables

CREATE TABLE contractor_settings (
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

CREATE TABLE time_entries (
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

CREATE TABLE time_entry_breaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  time_entry_id uuid NOT NULL REFERENCES time_entries(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz CHECK (end_time IS NULL OR end_time >= start_time),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE timesheet_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL CHECK (period_end >= period_start),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'submitted', 'amended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE timesheet_submissions (
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

CREATE TABLE time_entry_audit (
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

-- 2. Indexes

CREATE UNIQUE INDEX idx_time_entries_active_shift ON time_entries (user_id) WHERE clock_out IS NULL AND voided_at IS NULL;
CREATE UNIQUE INDEX idx_time_entry_breaks_active ON time_entry_breaks (time_entry_id) WHERE end_time IS NULL;
CREATE INDEX idx_time_entries_user_clock_in ON time_entries (user_id, clock_in);
CREATE INDEX idx_time_entries_needs_review ON time_entries (needs_review) WHERE needs_review = true;
CREATE INDEX idx_timesheet_periods_user_dates ON timesheet_periods (user_id, period_start, period_end);
CREATE INDEX idx_time_entry_audit_entry_id ON time_entry_audit (time_entry_id);
CREATE INDEX idx_timesheet_submissions_period ON timesheet_submissions (timesheet_period_id);

-- 3. Row Level Security

ALTER TABLE contractor_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entry_breaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheet_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheet_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entry_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contractor_settings_owner_all" ON contractor_settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "time_entries_owner_all" ON time_entries FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "time_entry_breaks_owner_all" ON time_entry_breaks FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM time_entries WHERE id = time_entry_breaks.time_entry_id AND user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM time_entries WHERE id = time_entry_breaks.time_entry_id AND user_id = auth.uid()));
CREATE POLICY "timesheet_periods_owner_all" ON timesheet_periods FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "timesheet_submissions_owner_read" ON timesheet_submissions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "time_entry_audit_owner_read" ON time_entry_audit FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 4. Atomic Auto-Close RPC

CREATE OR REPLACE FUNCTION auto_close_time_entry(p_entry_id uuid, p_boundary_time timestamptz)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to insert audit logs bypassing RLS if called by service role
AS $$
DECLARE
  v_user_id uuid;
  v_modified boolean := false;
BEGIN
  -- Attempt to lock and update the entry
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

    -- Close any open breaks
    UPDATE time_entry_breaks
    SET 
      end_time = p_boundary_time,
      updated_at = now()
    WHERE time_entry_id = p_entry_id AND end_time IS NULL;

    -- Insert audit log
    INSERT INTO time_entry_audit (
      time_entry_id, user_id, event_type, field_name, new_value, reason, created_at
    ) VALUES (
      p_entry_id, v_user_id, 'AUTO_CLOCK_OUT', 'clock_out', p_boundary_time::text, 'Automatically clocked out at midnight.', now()
    );
  END IF;

  RETURN v_modified;
END;
$$;

-- Revoke execute from public to ensure it's only called by service role / authenticated routes securely
REVOKE EXECUTE ON FUNCTION auto_close_time_entry(uuid, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION auto_close_time_entry(uuid, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION auto_close_time_entry(uuid, timestamptz) TO service_role;
