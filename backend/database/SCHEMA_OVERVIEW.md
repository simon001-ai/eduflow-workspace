# EduFlow Connect — Database schema overview

Supabase (PostgreSQL). **Student and lecturer login credentials live in `students` and `lecturers` only** — no shared `users` table.

---

## Tables and purpose

| Table | Purpose |
|-------|--------|
| **students** | Student accounts. Login: `admission_number` + `password_hash`. Profile: `fullname`, `email`. |
| **lecturers** | Lecturer accounts. Login: `staff_number` + `password_hash`. Profile: `full_name`, `institutional_email`. |
| **units** | Courses/units (name, code, semester, academic_year). Inserted by admin (seeders/API). |
| **student_unit_registrations** | Which units a student is registered for (student_id, unit_id, semester, academic_year). |
| **lecturer_unit_assignments** | Which units a lecturer teaches (lecturer_id, unit_id, semester, academic_year). |
| **resources** | Notes, assignments, additional materials, CATs. `unit_id`, `lecturer_id`, `type` (enum), `title`, `file_path`, `metadata` (e.g. cat duration, due date). |
| **submissions** | Student assignment/CAT submissions. `student_id`, `resource_id`, `file_path`/`content_text`, `plagiarism_percentage`. |
| **drafts** | Workspace drafts. `student_id`, optional `resource_id`, `title`, `content`, `file_path`. |
| **messages** | Inbox. `sender_type` + `sender_id`, `receiver_type` + `receiver_id` (student or lecturer), `subject`, `body`, `is_spam`, `link_scan_result`. |
| **message_attachments** | Attachments for messages. `message_id`, `file_path`. |
| **notifications** | Student notifications (new uploads). `student_id`, `resource_id`, `type` (note_uploaded, assignment_uploaded, cat_uploaded), `title`, `read_at`. |

---

## Enums

- **resource_type**: `note`, `assignment`, `additional_material`, `cat`
- **notification_type**: `note_uploaded`, `assignment_uploaded`, `cat_uploaded`
- **message_participant_type**: `student`, `lecturer`

---

## Relationships (short)

- Students ↔ Units: many-to-many via **student_unit_registrations**
- Lecturers ↔ Units: many-to-many via **lecturer_unit_assignments**
- Resources: belong to one **unit**, uploaded by one **lecturer**
- Submissions: one **student**, one **resource** (assignment or CAT), unique per (student, resource)
- Drafts: one **student**, optional **resource**
- Messages: sender and receiver each are either student or lecturer (type + id)
- Notifications: one **student**, one **resource**

---

## Files

- **migrations/001_initial_schema.sql** — Creates tables, enums, indexes, `updated_at` triggers. Run this first.
- **policies.sql** — RLS policies (students/lecturers see only their own data). Run after schema. Backend must issue JWTs with `role`, `student_id`, and/or `lecturer_id` when using Supabase client with anon key.
- **seeders/** — Use for initial units (and optionally test students/lecturers).

---

## Auth note

Login is done against **students** (admission_number + password) or **lecturers** (staff_number + password). Hash passwords (e.g. bcrypt) and store in `password_hash`. Issue your own JWT including `role` and `student_id` or `lecturer_id` so middleware and RLS can identify the current user.
