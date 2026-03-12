-- Create saved_drafts table
CREATE TABLE IF NOT EXISTS saved_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  content TEXT NOT NULL, -- Original text content
  file_url TEXT, -- URL to saved PDF file
  file_path TEXT, -- Path to saved PDF file in uploads
  draft_title TEXT DEFAULT 'Untitled Draft',
  last_saved TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, resource_id, id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_saved_drafts_student ON saved_drafts(student_id);
CREATE INDEX IF NOT EXISTS idx_saved_drafts_resource ON saved_drafts(resource_id);
CREATE INDEX IF NOT EXISTS idx_saved_drafts_student_resource ON saved_drafts(student_id, resource_id);

-- Enable RLS (Row Level Security)
ALTER TABLE saved_drafts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Students can only view their own drafts
CREATE POLICY "Students view own drafts" ON saved_drafts
  FOR SELECT USING (student_id = auth.uid()::uuid);

-- RLS Policy: Students can insert their own drafts
CREATE POLICY "Students insert own drafts" ON saved_drafts
  FOR INSERT WITH CHECK (student_id = auth.uid()::uuid);

-- RLS Policy: Students can update their own drafts
CREATE POLICY "Students update own drafts" ON saved_drafts
  FOR UPDATE USING (student_id = auth.uid()::uuid);

-- RLS Policy: Students can delete their own drafts
CREATE POLICY "Students delete own drafts" ON saved_drafts
  FOR DELETE USING (student_id = auth.uid()::uuid);
