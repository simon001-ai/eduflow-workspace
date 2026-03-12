-- Migration: Create submissions, ai_detection_reports, plagiarism_reports

CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id),
  assignment_id UUID REFERENCES assignments(id),
  file_url TEXT,
  extracted_text TEXT,
  ai_score FLOAT,
  plagiarism_score FLOAT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_detection_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID REFERENCES submissions(id),
  ai_probability FLOAT,
  human_probability FLOAT,
  sentence_level_analysis JSONB,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS plagiarism_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID REFERENCES submissions(id),
  compared_submission_id UUID REFERENCES submissions(id),
  similarity_score FLOAT,
  matching_segments JSONB,
  created_at TIMESTAMP DEFAULT now()
);
