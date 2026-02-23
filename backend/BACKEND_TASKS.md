# EduFlow Connect — Backend Implementation Plan

## 1. Project understanding (summary)

**EduFlow Connect** is a teaching staff and students app with:
- **Landing page** (frontend).
- **Auth**: separate signup/login for **students** and **lecturers** (different credentials).
- **Student flows**: dashboard (units + notifications), resources per unit, document analysis (plagiarism), workspace (drafts + AI recommendations + CATs), inbox (email-style messaging), help.
- **Lecturer flows**: dashboard (stats + units), resources (upload notes per unit), submissions (view student work + plagiarism %), inbox (same as student).

**Backend responsibilities:** auth, user/student/lecturer data, units and registration, resources (notes/assignments/materials/CATs), submissions, plagiarism analysis, workspace drafts, CATs, inbox/messaging + spam + link scanning, notifications, AI (Semantic Scholar). All files and DB are in the existing backend structure (Supabase, Express implied).

---

## 2. Functionalities to implement (mapped to backend)

### 2.1 Authentication
- Student signup: `fullname`, `admission_number`, `password`, `email`.
- Student login: `admission_number`, `password` → return token/session and student identity.
- Lecturer signup: `full_name`, `institutional_email`, `staff_number`, `password`.
- Lecturer login: `staff_number`, `password` → return token/session and lecturer identity.
- Logout / token invalidation (if applicable).
- Validation and error handling for all auth inputs.

### 2.2 Users, students, lecturers
- **Users**: base identity linked to Supabase Auth (or custom); role (student | lecturer).
- **Students**: profile (fullname, admission_number, email); get current student for dashboard name; list/update profile.
- **Lecturers**: profile (full_name, institutional_email, staff_number); get current lecturer; list/update profile.
- **Student–unit registration**: which units a student is registered for (used for dashboard and resources).
- **Lecturer–unit assignment**: which units a lecturer teaches (per semester); used for dashboard, resources, submissions.

### 2.3 Units
- Units are “inserted by admin” (no admin UI in scope): backend must support create/read (and possibly update) for units (e.g. via seeders/migrations or internal API).
- List units for student: only **registered** units.
- List units for lecturer: only **teaching** units for current semester.
- Unit metadata: name, code, semester (and any other fields needed for “this semester”).

### 2.4 Resources (notes, assignments, additional materials, CATs)
- **Lecturer**:
  - List units they teach.
  - Per unit: upload resources (notes, assignments, additional learning materials, CATs).
  - Store files (e.g. Supabase Storage) and metadata in DB (unit_id, type, title, file ref, timestamps).
  - List upload history per unit (notes, assignments, materials, CATs).
- **Student**:
  - List their registered units.
  - Per unit: get contents by type — Notes, Assignments, Additional learning materials (and CATs for workspace).
- **Resource types**: note, assignment, additional_material, cat (with optional flag for timed vs non-timed CAT).
- **CAT-specific**: store duration (for timed CATs); students “do and submit” CAT in workspace (see Submissions / Workspace).

### 2.5 Notifications
- **Create** notifications when lecturer uploads: notes, assignments, or CATs (target: students registered in that unit).
- **Student**: list recent notifications (e.g. “recent updates of uploaded notes, assignments and CATs”); optional mark as read.
- Notifications are “from lecturer side” but consumed on student dashboard.

### 2.6 Submissions (assignments)
- **Student**:
  - Submit assignment (linked to assignment resource, student, unit); optional file attachment.
  - Store plagiarism percentage with submission (from Document Analysis before submit).
- **Lecturer**:
  - List submissions by unit; for each submission show student, assignment, file, and plagiarism %.
  - Filter/arrange by unit.
- Submissions are “assignments” from students; CAT submissions may be same or separate model (see Workspace).

### 2.7 Document analysis (plagiarism)
- Integrate **plagiarism API** (e.g. Copyleaks, Turnitin, or other — API key).
  - Input: document (file or text).
  - Output: plagiarism percentage; optionally list of plagiarised parts.
- If percentage > 15%: return plagiarised segments and **recommendations** (e.g. research summaries, journals) — can use Semantic Scholar for recommendations.
- Used by student before resubmission; result can be attached to submission.

### 2.8 Workspace (drafts + AI + CATs)
- **Drafts**:
  - Save draft: link to student, assignment (or “free” draft), content (and optional file).
  - List drafts for current student; get one draft; update; delete.
  - “Turn in”: create submission from draft (and optionally run plagiarism check or use existing %).
- **AI assistant (Semantic Scholar)**:
  - Input: topic/assignment title or description.
  - Output: recommended papers/journals (no generative content for the assignment itself).
- **CATs**:
  - Student sees CATs for their units (time/non-timed).
  - Submit CAT “answer” (similar to submission: link to CAT resource, student, unit, response/file).
  - Timed CATs: store duration and possibly deadline; frontend enforces timer, backend may store submission time and duration.

### 2.9 Inbox (messaging + spam + link scanning)
- **Messaging** (email-style UI; can be in-app messages and/or real email via Resend):
  - Send message: lecturer ↔ student; optional document attachment.
  - Inbox: list received messages for current user.
  - Sent: list sent messages.
  - Store: sender, receiver(s), subject, body, attachments, timestamps.
- **Resend API**: if sending real emails, use API key for delivery; store copy in DB for inbox/sent.
- **Spam**:
  - Spam folder: list messages marked as spam; mark as spam / not spam.
  - Filter incoming: optional spam scoring or rules (e.g. block known spam patterns).
- **Link scanning (spoofing/malicious)**:
  - Background scan of links in message body for typosquatting/malicious URLs.
  - Flag or block messages with suspicious links; optionally store scan result per message.

### 2.10 Help
- No backend logic required beyond possibly serving static content or a small “help articles” API if you add it later. **Out of scope for this plan.**

### 2.11 Cross-cutting
- **Config**: Supabase client, env (port, API keys, Supabase URL/key), CORS.
- **App entry**: `app.js` (Express app, middleware, mount routes), `server.js` (listen).
- **Middleware**: auth (verify token/session), role (student vs lecturer), error handler, rate limiter.
- **Routes**: central `routes/index.js` that mounts auth, users, students, lecturers, units, resources, submissions, plagiarism, workspace, inbox, ai, notifications.
- **Utils**: file upload (e.g. to Supabase Storage), link scanner (called by inbox), logger, response formatter.
- **Database**: migrations for all tables; seeders for units (and optionally test users); RLS/policies in `policies.sql` for Supabase.

---

## 3. Task list (order of implementation)

Work through these **one task at a time**. Do not start the next until the current is done and reviewed.

| # | Task | Scope | Dependencies |
|---|------|--------|--------------|
| **1** | **Project bootstrap & config** | Add `package.json` (Express, Supabase, env, CORS, etc.). Implement `src/config/env.js`, `src/config/cors.js`, `src/config/supabaseClient.js`. Implement `src/app.js` (Express, CORS, JSON, mount placeholder route) and `src/server.js` (load env, start server). Create `.env.example` (no secrets). | None |
| **2** | **Database schema (Supabase)** | Define tables: users (or rely on Supabase Auth users), students, lecturers, units, student_unit_registrations, lecturer_unit_assignments, resources, submissions, drafts, cat_submissions (or extend submissions), messages, notifications, and any spam/link-scan tables. Add `database/migrations` (or SQL scripts) and `database/policies.sql` (RLS). No app logic yet. | Task 1 |
| **3** | **Auth: signup & login** | Implement auth module: validation (student vs lecturer payloads), service (register student/lecturer, login with admission_number or staff_number), controller, routes. Use Supabase Auth or custom JWT; persist student/lecturer profile on first signup. Return token + role + minimal user info. | Task 1, 2 |
| **4** | **Middleware: auth & role** | Implement `auth.middleware.js` (verify token, attach user to request) and `role.middleware.js` (require student or lecturer). Add `error.middleware.js` and `rateLimiter.middleware.js`. Wire in `app.js`. | Task 3 |
| **5** | **Users, students, lecturers (profiles & links)** | Implement user/student/lecturer models and services: get profile, update profile. Implement student–unit registration and lecturer–unit assignment (create/read). APIs: get current user profile, list units for current student/lecturer. | Task 3, 4 |
| **6** | **Units API** | Implement unit model and service: list units (for admin/seed), list by registration (student), list by assignment (lecturer, current semester). Add seeders for units (and optionally lecturer/student test data). | Task 5 |
| **7** | **File upload utility** | Implement `utils/fileUpload.js` (e.g. Supabase Storage): upload file, return URL/key; optional size/type checks. Used by resources, submissions, drafts, inbox attachments. | Task 1, 2 |
| **8** | **Resources (lecturer upload + student read)** | Implement resource model (unit, type, file ref, title, etc.). Lecturer: upload resource per unit, list upload history per unit. Student: list resources per unit by type (notes, assignments, additional_materials, CATs). Wire routes and controllers. | Task 5, 6, 7 |
| **9** | **Notifications** | Create notification when lecturer uploads resource (notes/assignments/CATs); target students registered in that unit. Student: list recent notifications (e.g. by unit, paginated). Optional: mark as read. | Task 5, 8 |
| **10** | **Submissions (assignments)** | Student: submit assignment (resource_id, student_id, file/content, plagiarism_percentage). Lecturer: list submissions by unit with plagiarism %. Model and API only; plagiarism % can be 0 until Task 11. | Task 5, 8 |
| **11** | **Plagiarism integration** | Integrate plagiarism API in `plagiarism.service.js`: analyze document, return percentage and plagiarised parts. If >15%, optionally fetch recommendations (Semantic Scholar). Expose analyze endpoint; frontend can attach result to submission. | Task 7 |
| **12** | **Workspace: drafts** | Save, list, get, update, delete drafts (student, assignment_id optional, content/attachments). “Turn in” = create submission from draft (reuse submission service). | Task 5, 7, 10 |
| **13** | **Workspace: CATs** | Model for CAT submissions (or reuse submissions with type=cat). Student: list CATs for units (from resources), submit CAT answer (timed: store duration/deadline if needed). Lecturer: no extra backend beyond existing resources. | Task 8, 10 |
| **14** | **AI: Semantic Scholar** | Implement `semanticScholar.service.js`: given topic/query, call Semantic Scholar API, return list of recommended papers/journals. Expose via `semanticScholar.controller.js` for workspace AI assistant and optionally plagiarism recommendations. | Task 1 (API key) |
| **15** | **Inbox: messaging** | Send message (lecturer/student), list inbox, list sent; optional attachments (use file upload). Store in messages table; optionally send via Resend and store copy. | Task 5, 7 |
| **16** | **Inbox: Resend integration** | If using real email: send outbound emails via Resend API; store sent copy in DB. Inbound: if you use Resend webhooks for delivery, parse and store; otherwise inbox is in-app only. | Task 15 |
| **17** | **Inbox: spam folder & filtering** | Spam folder: list messages marked as spam; mark as spam / not spam. Optional: simple spam rules or scoring. | Task 15 |
| **18** | **Inbox: link scanner** | Implement `utils/linkScanner.js`: scan text for URLs, check for typosquatting/suspicious patterns (or call external API). Use in message save/send flow; flag or block suspicious links. | Task 15 |
| **19** | **Routes & response formatting** | Centralize all routes in `routes/index.js`; apply auth/role middleware per route. Use `utils/responseFormatter.js` for consistent API responses. Ensure logger used where appropriate. | Tasks 3–18 |
| **20** | **Dashboard aggregations** | **Student dashboard**: name (from profile), list registered units (existing API), recent notifications (existing API). **Lecturer dashboard**: new submissions count, total students per unit, resources count per unit, list units teaching. Add small dashboard endpoints or reuse existing list APIs with counts. | Task 5, 6, 8, 9, 10 |

---

## 4. Suggested order summary

1. Bootstrap & config  
2. Database schema  
3. Auth (signup/login)  
4. Middleware (auth, role, error, rate limit)  
5. Users, students, lecturers, unit registration/assignment  
6. Units API + seeders  
7. File upload utility  
8. Resources (upload + read by type/unit)  
9. Notifications  
10. Submissions (assignments)  
11. Plagiarism API  
12. Workspace drafts + turn-in  
13. CATs (list + submit)  
14. Semantic Scholar AI  
15. Inbox messaging  
16. Resend (if real email)  
17. Spam folder  
18. Link scanner  
19. Routes & response formatting  
20. Dashboard aggregations  

---

## 5. Notes

- **Admin**: Units are “inserted by admin” with no admin UI; use seeders or a single internal/script endpoint to create units.
- **Help**: No backend tasks; can add a minimal “help content” API later if needed.
- **APIs to integrate**: Plagiarism (API key), Semantic Scholar (API key), Resend (API key). Keep keys in `.env` and document in `.env.example`.
- **Security**: Use RLS and policies in Supabase; validate all inputs; rate-limit auth and heavy endpoints.
- **Testing**: After each task, manually or with tests verify the new behaviour before moving on.

Use this file as the single source of truth for “what to do next” and tick off or annotate tasks as you complete them.
