-- Quote requests submitted by customers via /quote
CREATE TABLE IF NOT EXISTS quote_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  name          text NOT NULL,
  phone         text NOT NULL,
  email         text,
  service       text NOT NULL,
  details       text,
  status        text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'contacted', 'converted', 'dismissed')),
  admin_notes   text
);

-- Admins can read/update all rows; public can only insert
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all" ON quote_requests
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "public_insert" ON quote_requests
  FOR INSERT
  TO anon
  WITH CHECK (true);
