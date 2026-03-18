-- Brand examples for custom AI personas (Phase 2c)
CREATE TABLE brand_examples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('linkedin', 'twitter', 'changelog')),
  created_at timestamptz DEFAULT NOW()
);

CREATE INDEX brand_examples_user_id_idx ON brand_examples(user_id);

ALTER TABLE brand_examples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own brand examples"
  ON brand_examples
  FOR ALL
  USING (true);
