-- Add missing tables for tags and other features

-- Tags table
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT UNIQUE NOT NULL,
  cor TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tags" ON tags FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Admins can manage tags" ON tags FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Lead tag assignments
CREATE TABLE lead_tag_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (lead_id, tag_id)
);

ALTER TABLE lead_tag_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tag assignments" ON lead_tag_assignments FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated users can manage tag assignments" ON lead_tag_assignments FOR ALL TO authenticated USING (TRUE);

-- Rename advancement_criteria to stage_advancement_criteria for clarity
ALTER TABLE advancement_criteria RENAME TO stage_advancement_criteria;

-- Rename lead_criteria_states to lead_criteria_state for consistency
ALTER TABLE lead_criteria_states RENAME TO lead_criteria_state;

-- Add full_name column to profiles for compatibility
ALTER TABLE profiles ADD COLUMN full_name TEXT;

-- Add success column to security_events
ALTER TABLE security_events ADD COLUMN success BOOLEAN DEFAULT TRUE;

-- Add relationship fields to orders
ALTER TABLE orders ADD COLUMN lead_id UUID REFERENCES leads(id) ON DELETE CASCADE;
ALTER TABLE orders ADD COLUMN closer TEXT;