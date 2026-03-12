-- Migration: Add AI score, extracted text, and status columns to submissions table
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS ai_score NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS extracted_text TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

-- Add index on status for efficient filtering
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
