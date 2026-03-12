-- =============================================================================
-- EduFlow Connect — Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Run Part 1 first, then Part 2. Or run the entire file at once.
-- =============================================================================

-- ############################################################################
-- PART 1: SCHEMA (tables, enums, indexes, triggers)
-- ############################################################################

-- ENUMS
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

-- STUDENTS (login: admission_number + password_hash)
CREATE TABLE students (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fullname          TEXT NOT NULL,
  admission_number  TEXT NOT NULL UNIQUE,
  email             TEXT NOT NULL UNIQUE,
  password_hash     TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_students_admission_number ON students(admission_number);
CREATE INDEX idx_students_email ON students(email);

-- LECTURERS (login: staff_number + password_hash)
CREATE TABLE lecturers (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name            TEXT NOT NULL,
  institutional_email  TEXT NOT NULL UNIQUE,
  staff_number         TEXT NOT NULL UNIQUE,
  password_hash        TEXT NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lecturers_staff_number ON lecturers(staff_number);
CREATE INDEX idx_lecturers_institutional_email ON lecturers(institutional_email);

-- UNITS
CREATE TABLE units (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  code          TEXT NOT NULL UNIQUE,
  semester      TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_units_semester_year ON units(semester, academic_year);

-- STUDENT – UNIT REGISTRATION
CREATE TABLE student_unit_registrations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  unit_id      UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  semester     TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, unit_id, semester, academic_year)
);

CREATE INDEX idx_student_unit_reg_student ON student_unit_registrations(student_id);
CREATE INDEX idx_student_unit_reg_unit ON student_unit_registrations(unit_id);

-- LECTURER – UNIT ASSIGNMENT
CREATE TABLE lecturer_unit_assignments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecturer_id   UUID NOT NULL REFERENCES lecturers(id) ON DELETE CASCADE,
  unit_id       UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  semester      TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  assigned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (lecturer_id, unit_id, semester, academic_year)
);

CREATE INDEX idx_lecturer_unit_assign_lecturer ON lecturer_unit_assignments(lecturer_id);
CREATE INDEX idx_lecturer_unit_assign_unit ON lecturer_unit_assignments(unit_id);

-- RESOURCES (notes, assignments, materials, CATs)
CREATE TABLE resources (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id      UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  lecturer_id  UUID NOT NULL REFERENCES lecturers(id) ON DELETE CASCADE,
  type         resource_type NOT NULL,
  title        TEXT NOT NULL,
  file_path    TEXT,
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_resources_unit ON resources(unit_id);
CREATE INDEX idx_resources_lecturer ON resources(lecturer_id);
CREATE INDEX idx_resources_type ON resources(type);
CREATE INDEX idx_resources_created ON resources(created_at DESC);

-- SUBMISSIONS
CREATE TABLE submissions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- DRAFTS (workspace)
CREATE TABLE drafts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- MESSAGES (inbox)
CREATE TABLE messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE INDEX idx_messages_receiver ON messages(receiver_type, receiver_id);
CREATE INDEX idx_messages_sender ON messages(sender_type, sender_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_messages_spam ON messages(receiver_type, receiver_id, is_spam) WHERE is_spam = TRUE;

-- MESSAGE ATTACHMENTS
CREATE TABLE message_attachments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id  UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_path   TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_message_attachments_message ON message_attachments(message_id);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- UPDATED_AT TRIGGERS
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER lecturers_updated_at
  BEFORE UPDATE ON lecturers
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER units_updated_at
  BEFORE UPDATE ON units
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER drafts_updated_at
  BEFORE UPDATE ON drafts
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();


-- ############################################################################
-- PART 2: ROW LEVEL SECURITY (RLS) POLICIES
-- Run after Part 1. Backend uses service_role so it bypasses RLS.
-- ############################################################################

ALTER TABLE students                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecturers                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE units                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_unit_registrations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecturer_unit_assignments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE drafts                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications                ENABLE ROW LEVEL SECURITY;

-- Students: own row
CREATE POLICY "Students read own row"
  ON students FOR SELECT
  USING (id = (auth.jwt() ->> 'student_id')::uuid);

CREATE POLICY "Students update own row"
  ON students FOR UPDATE
  USING (id = (auth.jwt() ->> 'student_id')::uuid);

-- Lecturers: own row
CREATE POLICY "Lecturers read own row"
  ON lecturers FOR SELECT
  USING (id = (auth.jwt() ->> 'lecturer_id')::uuid);

CREATE POLICY "Lecturers update own row"
  ON lecturers FOR UPDATE
  USING (id = (auth.jwt() ->> 'lecturer_id')::uuid);

-- Units: by registration/assignment
CREATE POLICY "Students read registered units"
  ON units FOR SELECT
  USING (
    id IN (
      SELECT unit_id FROM student_unit_registrations
      WHERE student_id = (auth.jwt() ->> 'student_id')::uuid
    )
  );

CREATE POLICY "Lecturers read assigned units"
  ON units FOR SELECT
  USING (
    id IN (
      SELECT unit_id FROM lecturer_unit_assignments
      WHERE lecturer_id = (auth.jwt() ->> 'lecturer_id')::uuid
    )
  );

-- Student unit registrations
CREATE POLICY "Students read own registrations"
  ON student_unit_registrations FOR SELECT
  USING (student_id = (auth.jwt() ->> 'student_id')::uuid);

-- Lecturer unit assignments
CREATE POLICY "Lecturers read own assignments"
  ON lecturer_unit_assignments FOR SELECT
  USING (lecturer_id = (auth.jwt() ->> 'lecturer_id')::uuid);

-- Resources
CREATE POLICY "Students read resources for registered units"
  ON resources FOR SELECT
  USING (
    unit_id IN (
      SELECT unit_id FROM student_unit_registrations
      WHERE student_id = (auth.jwt() ->> 'student_id')::uuid
    )
  );

CREATE POLICY "Lecturers read own uploaded resources"
  ON resources FOR SELECT
  USING (lecturer_id = (auth.jwt() ->> 'lecturer_id')::uuid);

CREATE POLICY "Lecturers insert resources for assigned units"
  ON resources FOR INSERT
  WITH CHECK (
    lecturer_id = (auth.jwt() ->> 'lecturer_id')::uuid
    AND (lecturer_id, unit_id) IN (
      SELECT lecturer_id, unit_id FROM lecturer_unit_assignments
    )
  );

CREATE POLICY "Lecturers update own resources"
  ON resources FOR UPDATE
  USING (lecturer_id = (auth.jwt() ->> 'lecturer_id')::uuid);

CREATE POLICY "Lecturers delete own resources"
  ON resources FOR DELETE
  USING (lecturer_id = (auth.jwt() ->> 'lecturer_id')::uuid);

-- Submissions
CREATE POLICY "Students read own submissions"
  ON submissions FOR SELECT
  USING (student_id = (auth.jwt() ->> 'student_id')::uuid);

CREATE POLICY "Students insert own submissions"
  ON submissions FOR INSERT
  WITH CHECK (student_id = (auth.jwt() ->> 'student_id')::uuid);

CREATE POLICY "Lecturers read submissions for their units"
  ON submissions FOR SELECT
  USING (
    resource_id IN (
      SELECT id FROM resources WHERE lecturer_id = (auth.jwt() ->> 'lecturer_id')::uuid
    )
  );

-- Drafts
CREATE POLICY "Students manage own drafts"
  ON drafts FOR ALL
  USING (student_id = (auth.jwt() ->> 'student_id')::uuid)
  WITH CHECK (student_id = (auth.jwt() ->> 'student_id')::uuid);

-- Messages
CREATE POLICY "Users read messages where they are sender or receiver"
  ON messages FOR SELECT
  USING (
    (sender_type = 'student' AND sender_id = (auth.jwt() ->> 'student_id')::uuid)
    OR (receiver_type = 'student' AND receiver_id = (auth.jwt() ->> 'student_id')::uuid)
    OR (sender_type = 'lecturer' AND sender_id = (auth.jwt() ->> 'lecturer_id')::uuid)
    OR (receiver_type = 'lecturer' AND receiver_id = (auth.jwt() ->> 'lecturer_id')::uuid)
  );

CREATE POLICY "Users insert messages as sender"
  ON messages FOR INSERT
  WITH CHECK (
    (sender_type = 'student' AND sender_id = (auth.jwt() ->> 'student_id')::uuid)
    OR (sender_type = 'lecturer' AND sender_id = (auth.jwt() ->> 'lecturer_id')::uuid)
  );

CREATE POLICY "Users update own received messages (e.g. mark spam)"
  ON messages FOR UPDATE
  USING (
    (receiver_type = 'student' AND receiver_id = (auth.jwt() ->> 'student_id')::uuid)
    OR (receiver_type = 'lecturer' AND receiver_id = (auth.jwt() ->> 'lecturer_id')::uuid)
  );

-- Message attachments
CREATE POLICY "Users read attachments for their messages"
  ON message_attachments FOR SELECT
  USING (
    message_id IN (
      SELECT id FROM messages WHERE
        (sender_type = 'student' AND sender_id = (auth.jwt() ->> 'student_id')::uuid)
        OR (receiver_type = 'student' AND receiver_id = (auth.jwt() ->> 'student_id')::uuid)
        OR (sender_type = 'lecturer' AND sender_id = (auth.jwt() ->> 'lecturer_id')::uuid)
        OR (receiver_type = 'lecturer' AND receiver_id = (auth.jwt() ->> 'lecturer_id')::uuid)
    )
  );

CREATE POLICY "Users insert attachments for own sent messages"
  ON message_attachments FOR INSERT
  WITH CHECK (
    message_id IN (
      SELECT id FROM messages WHERE
        (sender_type = 'student' AND sender_id = (auth.jwt() ->> 'student_id')::uuid)
        OR (sender_type = 'lecturer' AND sender_id = (auth.jwt() ->> 'lecturer_id')::uuid)
    )
  );

-- Notifications
CREATE POLICY "Students read own notifications"
  ON notifications FOR SELECT
  USING (student_id = (auth.jwt() ->> 'student_id')::uuid);

CREATE POLICY "Students update own notifications (e.g. mark read)"
  ON notifications FOR UPDATE
  USING (student_id = (auth.jwt() ->> 'student_id')::uuid);
-- =============================================================================
-- MIGRATION 011: Add message deletion tracking columns
-- =============================================================================

-- Add deletion columns to chat_messages for tracking delete-for-you vs delete-for-everyone
ALTER TABLE chat_messages
ADD COLUMN deleted_for_sender BOOLEAN DEFAULT false,
ADD COLUMN deleted_for_recipient BOOLEAN DEFAULT false;

-- Create index for efficient filtering of active messages
CREATE INDEX idx_chat_messages_active ON chat_messages(
  sender_id,
  recipient_id,
  deleted_for_sender,
  deleted_for_recipient
);

-- Add comments for clarity
COMMENT ON COLUMN chat_messages.deleted_for_sender IS 'True if message is deleted for sender only (they deleted for themselves)';
COMMENT ON COLUMN chat_messages.deleted_for_recipient IS 'True if message is deleted for both parties (sender deleted for everyone)';