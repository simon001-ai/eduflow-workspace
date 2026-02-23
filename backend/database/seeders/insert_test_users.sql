-- Test users for login (EduFlow Connect)
-- Option A: Run in Supabase SQL Editor (requires pgcrypto extension).
-- Option B: Prefer running from backend: npm run seed:users (uses bcrypt in Node).

-- Enable pgcrypto for crypt/gen_salt (Supabase usually has it)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Student (admission_number: j77-3860-2023, password: 123456)
INSERT INTO students (fullname, admission_number, email, password_hash)
VALUES (
  'isho clem',
  'j77-3860-2023',
  'j77-3860-2023@student.mksu.ac.ke',
  crypt('123456', gen_salt('bf'))
)
ON CONFLICT (admission_number) DO NOTHING;

-- Lecturer (staff_number: 001, password: 098765)
INSERT INTO lecturers (full_name, institutional_email, staff_number, password_hash)
VALUES (
  'DR.osoro',
  'njoroogu@gmail.com',
  '001',
  crypt('098765', gen_salt('bf'))
)
ON CONFLICT (staff_number) DO NOTHING;

-- If login fails after using this SQL (hash format mismatch with Node bcrypt),
-- delete these rows and run instead: npm run seed:users
