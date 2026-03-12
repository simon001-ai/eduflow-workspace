-- Migration: Add grade and feedback columns to submissions table
ALTER TABLE submissions
  ADD COLUMN grade NUMERIC(5,2),
  ADD COLUMN feedback TEXT;
