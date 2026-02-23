-- EduFlow Connect — Supabase (PostgreSQL) schema
-- Auth: student login in students table, lecturer login in lecturers table (no shared users table).

-- Enable UUID extension (Supabase has it by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE resource_type AS ENUM (
  'note',
  'assignment',
  'additional_material',
  'cat'
);

CREATE TYPE notification_type AS ENUM (
  'note_uploaded',
  'assignment_uploaded',
  'cat_uploaded'
);

CREATE TYPE message_participant_type AS ENUM (
  'student',
  'lecturer'
);

-- =============================================================================
-- CORE: STUDENTS (login credentials stored here)
-- =============================================================================

CREATE TABLE students (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fullname          TEXT NOT NULL,
  admission_number  TEXT NOT NULL UNIQUE,
  email             TEXT NOT NULL UNIQUE,
  password_hash     TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_students_admission_number ON students(admission_number);
CREATE INDEX idx_students_email ON students(email);

-- =============================================================================
-- CORE: LECTURERS (login credentials stored here)
-- =============================================================================

CREATE TABLE lecturers (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name            TEXT NOT NULL,
  institutional_email  TEXT NOT NULL UNIQUE,
  staff_number         TEXT NOT NULL UNIQUE,
  password_hash        TEXT NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lecturers_staff_number ON lecturers(staff_number);
CREATE INDEX idx_lecturers_institutional_email ON lecturers(institutional_email);

-- =============================================================================
-- UNITS (inserted by admin via seeders/API)
-- =============================================================================

CREATE TABLE units (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  code          TEXT NOT NULL UNIQUE,
  semester      TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_units_semester_year ON units(semester, academic_year);

-- =============================================================================
-- STUDENT – UNIT REGISTRATION (which units a student is registered for)
-- =============================================================================

CREATE TABLE student_unit_registrations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  unit_id     UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  semester    TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, unit_id, semester, academic_year)
);

CREATE INDEX idx_student_unit_reg_student ON student_unit_registrations(student_id);
CREATE INDEX idx_student_unit_reg_unit ON student_unit_registrations(unit_id);

-- =============================================================================
-- LECTURER – UNIT ASSIGNMENT (which units a lecturer teaches, per semester)
-- =============================================================================

CREATE TABLE lecturer_unit_assignments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lecturer_id   UUID NOT NULL REFERENCES lecturers(id) ON DELETE CASCADE,
  unit_id       UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  semester      TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  assigned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (lecturer_id, unit_id, semester, academic_year)
);

CREATE INDEX idx_lecturer_unit_assign_lecturer ON lecturer_unit_assignments(lecturer_id);
CREATE INDEX idx_lecturer_unit_assign_unit ON lecturer_unit_assignments(unit_id);

-- =============================================================================
-- RESOURCES (notes, assignments, additional materials, CATs — uploaded by lecturers)
-- =============================================================================

CREATE TABLE resources (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id      UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  lecturer_id  UUID NOT NULL REFERENCES lecturers(id) ON DELETE CASCADE,
  type         resource_type NOT NULL,
  title        TEXT NOT NULL,
  file_path    TEXT,
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- metadata examples: { "cat_duration_minutes": 60, "due_date": "2025-03-01", "is_timed": true }
CREATE INDEX idx_resources_unit ON resources(unit_id);
CREATE INDEX idx_resources_lecturer ON resources(lecturer_id);
CREATE INDEX idx_resources_type ON resources(type);
CREATE INDEX idx_resources_created ON resources(created_at DESC);

-- =============================================================================
-- SUBMISSIONS (assignment and CAT submissions from students)
-- =============================================================================

CREATE TABLE submissions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id            UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  resource_id           UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  file_path             TEXT,
  content_text          TEXT,
  plagiarism_percentage NUMERIC(5,2),
  submitted_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, resource_id)
);

CREATE INDEX idx_submissions_student ON submissions(student_id);
CREATE INDEX idx_submissions_resource ON submissions(resource_id);
CREATE INDEX idx_submissions_submitted ON submissions(submitted_at DESC);

-- =============================================================================
-- DRAFTS (workspace — student drafts for assignments, optional link to resource)
-- =============================================================================

CREATE TABLE drafts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id   UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  resource_id  UUID REFERENCES resources(id) ON DELETE SET NULL,
  title        TEXT,
  content      TEXT,
  file_path    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_drafts_student ON drafts(student_id);
CREATE INDEX idx_drafts_resource ON drafts(resource_id);

-- =============================================================================
-- MESSAGES (inbox — lecturer ↔ student, with spam and link-scan fields)
-- =============================================================================

CREATE TABLE messages (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_type      message_participant_type NOT NULL,
  sender_id        UUID NOT NULL,
  receiver_type    message_participant_type NOT NULL,
  receiver_id      UUID NOT NULL,
  subject          TEXT NOT NULL DEFAULT '',
  body             TEXT NOT NULL DEFAULT '',
  is_spam          BOOLEAN NOT NULL DEFAULT FALSE,
  link_scan_result JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- sender_id/receiver_id reference either students.id or lecturers.id depending on sender_type/receiver_type
CREATE INDEX idx_messages_receiver ON messages(receiver_type, receiver_id);
CREATE INDEX idx_messages_sender ON messages(sender_type, sender_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_messages_spam ON messages(receiver_type, receiver_id, is_spam) WHERE is_spam = TRUE;

-- =============================================================================
-- MESSAGE ATTACHMENTS
-- =============================================================================

CREATE TABLE message_attachments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id  UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_path   TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_message_attachments_message ON message_attachments(message_id);

-- =============================================================================
-- NOTIFICATIONS (for students: new notes, assignments, CATs in their units)
-- =============================================================================

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  type        notification_type NOT NULL,
  title       TEXT NOT NULL,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_student ON notifications(student_id);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(student_id, read_at) WHERE read_at IS NULL;

-- =============================================================================
-- UPDATED_AT TRIGGERS (optional)
-- =============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION set_updated_at;

CREATE TRIGGER lecturers_updated_at
  BEFORE UPDATE ON lecturers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at;

CREATE TRIGGER units_updated_at
  BEFORE UPDATE ON units
  FOR EACH ROW EXECUTE FUNCTION set_updated_at;

CREATE TRIGGER resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW EXECUTE FUNCTION set_updated_at;

CREATE TRIGGER drafts_updated_at
  BEFORE UPDATE ON drafts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at;
