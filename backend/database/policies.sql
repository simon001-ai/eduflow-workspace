-- EduFlow Connect — Row Level Security (RLS) policies
-- Assumes backend issues JWT with claims: role ('student' | 'lecturer'), student_id (uuid), lecturer_id (uuid).
-- Service role key bypasses RLS; these policies apply when using anon key with JWT.

-- =============================================================================
-- ENABLE RLS ON ALL TABLES
-- =============================================================================

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

-- =============================================================================
-- HELPER: JWT claim helpers (use in policies)
-- =============================================================================
-- In Supabase, auth.jwt() returns the validated JWT payload.
-- Your backend must issue JWTs with: { role: 'student'|'lecturer', student_id?: uuid, lecturer_id?: uuid }

-- =============================================================================
-- STUDENTS: own row only
-- =============================================================================

CREATE POLICY "Students read own row"
  ON students FOR SELECT
  USING (id = (auth.jwt() ->> 'student_id')::uuid);

CREATE POLICY "Students update own row"
  ON students FOR UPDATE
  USING (id = (auth.jwt() ->> 'student_id')::uuid);

-- Insert only via backend (e.g. signup); no policy = no direct insert from client with anon key
-- Or allow service role only for insert

-- =============================================================================
-- LECTURERS: own row only
-- =============================================================================

CREATE POLICY "Lecturers read own row"
  ON lecturers FOR SELECT
  USING (id = (auth.jwt() ->> 'lecturer_id')::uuid);

CREATE POLICY "Lecturers update own row"
  ON lecturers FOR UPDATE
  USING (id = (auth.jwt() ->> 'lecturer_id')::uuid);

-- =============================================================================
-- UNITS: students see registered units, lecturers see assigned units
-- =============================================================================

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

-- =============================================================================
-- STUDENT_UNIT_REGISTRATIONS: students read own; manage via backend
-- =============================================================================

CREATE POLICY "Students read own registrations"
  ON student_unit_registrations FOR SELECT
  USING (student_id = (auth.jwt() ->> 'student_id')::uuid);

-- =============================================================================
-- LECTURER_UNIT_ASSIGNMENTS: lecturers read own
-- =============================================================================

CREATE POLICY "Lecturers read own assignments"
  ON lecturer_unit_assignments FOR SELECT
  USING (lecturer_id = (auth.jwt() ->> 'lecturer_id')::uuid);

-- =============================================================================
-- RESOURCES: students read by registered unit; lecturers read/write for their units
-- =============================================================================

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

-- =============================================================================
-- SUBMISSIONS: students own submissions; lecturers read by unit
-- =============================================================================

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

-- =============================================================================
-- DRAFTS: students only, own rows
-- =============================================================================

CREATE POLICY "Students manage own drafts"
  ON drafts FOR ALL
  USING (student_id = (auth.jwt() ->> 'student_id')::uuid)
  WITH CHECK (student_id = (auth.jwt() ->> 'student_id')::uuid);

-- =============================================================================
-- MESSAGES: sender and receiver can read
-- =============================================================================

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

-- =============================================================================
-- MESSAGE_ATTACHMENTS: same as messages
-- =============================================================================

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

-- =============================================================================
-- NOTIFICATIONS: students read own
-- =============================================================================

CREATE POLICY "Students read own notifications"
  ON notifications FOR SELECT
  USING (student_id = (auth.jwt() ->> 'student_id')::uuid);

CREATE POLICY "Students update own notifications (e.g. mark read)"
  ON notifications FOR UPDATE
  USING (student_id = (auth.jwt() ->> 'student_id')::uuid);
