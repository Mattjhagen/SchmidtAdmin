-- Customer portal: two-way messages between customers and contractors,
-- plus tightened RLS now that customers can hold authenticated accounts.

-- Admin allowlist consulted by RLS policies (mirrors ADMIN_EMAILS in src/lib/auth.ts)
CREATE TABLE IF NOT EXISTS portal_admins (
  email text PRIMARY KEY
);

INSERT INTO portal_admins (email) VALUES
  ('matty@purepulse.one'),
  ('admin@schmidt-construction.com'),
  ('mike@walls2.com'),
  ('mikiel@schmidt-construction.com')
ON CONFLICT DO NOTHING;

-- RLS on with no policies: only the service role (and SECURITY DEFINER
-- helpers) can touch the allowlist.
ALTER TABLE portal_admins ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_portal_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM portal_admins
    WHERE lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
  );
$$;

-- Before the portal existed, every authenticated user was an admin, so
-- "admin_all" granted ALL to authenticated. Customers can now sign up, so
-- scope admin access to the allowlist and let customers read only their own
-- requests (matched by the email on their Supabase account).
DROP POLICY IF EXISTS "admin_all" ON quote_requests;

CREATE POLICY "admin_all" ON quote_requests
  FOR ALL
  TO authenticated
  USING (is_portal_admin())
  WITH CHECK (is_portal_admin());

CREATE POLICY "customer_read_own" ON quote_requests
  FOR SELECT
  TO authenticated
  USING (lower(email) = lower(coalesce(auth.jwt()->>'email', '')));

-- Message thread attached to each quote request
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

CREATE POLICY "admin_all" ON portal_messages
  FOR ALL
  TO authenticated
  USING (is_portal_admin())
  WITH CHECK (is_portal_admin());

CREATE POLICY "customer_read_own" ON portal_messages
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM quote_requests q
    WHERE q.id = quote_request_id
      AND lower(q.email) = lower(coalesce(auth.jwt()->>'email', ''))
  ));

CREATE POLICY "customer_insert_own" ON portal_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_role = 'customer'
    AND EXISTS (
      SELECT 1 FROM quote_requests q
      WHERE q.id = quote_request_id
        AND lower(q.email) = lower(coalesce(auth.jwt()->>'email', ''))
    )
  );
