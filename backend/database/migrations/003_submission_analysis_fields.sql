-- Migration: Add fields for AI, plagiarism report, and status to submissions
ALTER TABLE submissions
  ADD COLUMN is_ai_generated BOOLEAN DEFAULT FALSE,
  ADD COLUMN plagiarism_report_url TEXT,
  ADD COLUMN status VARCHAR(10) DEFAULT 'draft';
