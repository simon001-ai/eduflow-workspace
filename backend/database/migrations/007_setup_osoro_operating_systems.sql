-- Migration: Set up Dr. Osoro teaching Operating Systems Semester 2 to student Clem
-- This ensures:
-- 1. Operating Systems Semester 2 unit exists
-- 2. Clem (student) is registered for the unit
-- 3. Dr. Osoro (lecturer) is assigned to teach the unit

-- =============================================================================
-- 1. INSERT UNIT: Operating Systems Semester 2
-- =============================================================================
INSERT INTO units (name, code, semester, academic_year)
VALUES (
  'Operating Systems', 
  'CS201', 
  'Semester 2', 
  '2025/2026'
)
ON CONFLICT (code) DO NOTHING
RETURNING id AS unit_id;

-- =============================================================================
-- 2. ASSIGN STUDENT CLEM TO THE UNIT
-- =============================================================================
-- First, get the student and unit IDs
WITH student_info AS (
  SELECT id FROM students WHERE admission_number = 'j77-3860-2023'
),
unit_info AS (
  SELECT id FROM units WHERE code = 'CS201'
)
INSERT INTO student_unit_registrations (student_id, unit_id, semester, academic_year)
SELECT s.id, u.id, 'Semester 2', '2025/2026'
FROM student_info s, unit_info u
ON CONFLICT (student_id, unit_id, semester, academic_year) DO NOTHING;

-- =============================================================================
-- 3. ASSIGN LECTURER DR.OSORO TO TEACH THE UNIT
-- =============================================================================
-- This is the critical assignment that enables the lecturer to see submissions
WITH lecturer_info AS (
  SELECT id FROM lecturers WHERE staff_number = '001'
),
unit_info AS (
  SELECT id FROM units WHERE code = 'CS201'
)
INSERT INTO lecturer_unit_assignments (lecturer_id, unit_id, semester, academic_year)
SELECT l.id, u.id, 'Semester 2', '2025/2026'
FROM lecturer_info l, unit_info u
ON CONFLICT (lecturer_id, unit_id, semester, academic_year) DO NOTHING;

-- =============================================================================
-- 4. VERIFICATION QUERIES (run separately to check data)
-- =============================================================================

-- View the created unit:
-- SELECT id, name, code, semester, academic_year FROM units WHERE code = 'CS201';

-- View student registration:
-- SELECT s.fullname, u.code, u.name, sr.semester 
-- FROM student_unit_registrations sr
-- JOIN students s ON sr.student_id = s.id
-- JOIN units u ON sr.unit_id = u.id
-- WHERE s.admission_number = 'j77-3860-2023';

-- View lecturer assignment:
-- SELECT l.full_name, u.code, u.name, lua.semester
-- FROM lecturer_unit_assignments lua
-- JOIN lecturers l ON lua.lecturer_id = l.id
-- JOIN units u ON lua.unit_id = u.id
-- WHERE l.staff_number = '001';
