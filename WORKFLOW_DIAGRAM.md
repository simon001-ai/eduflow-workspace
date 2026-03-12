# 📊 System Workflow Diagram

## Complete Author-to-Grading Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    LECTURER UNIT ASSIGNMENT WORKFLOW                       │
└─────────────────────────────────────────────────────────────────────────────┘

STEP 1: DATABASE SETUP (One-time)
═════════════════════════════════════════════════════════════════════════════

    ┌──────────────────┐
    │  UNITS TABLE     │
    ├──────────────────┤
    │ id               │
    │ name: "Operating │
    │       Systems"   │
    │ code: "CS201"    │
    │ semester: "2"    │
    │ academic_year: . │
    └──────────────────┘
             △
             │
             │ INSERT
             │
    ╔════════════════════════════════════════════════════════╗
    ║  007_setup_osoro_operating_systems.sql                ║
    ║  (or) setup-unit-assignments.js                       ║
    ╚════════════════════════════════════════════════════════╝
             │
             ├─────────────┬────────────────────────┐
             │             │                        │
             ▼             ▼                        ▼

    ┌─────────────────────────┐   ┌─────────────────────────┐
    │ STUDENT_UNIT_           │   │ LECTURER_UNIT_          │
    │ REGISTRATIONS           │   │ ASSIGNMENTS             │
    ├─────────────────────────┤   ├─────────────────────────┤
    │ student_id: Clem        │   │ lecturer_id: Dr.Osoro   │
    │ unit_id: CS201          │   │ unit_id: CS201          │
    │ semester: "2"           │   │ semester: "2"           │
    └─────────────────────────┘   └─────────────────────────┘


STEP 2: LECTURER UPLOADS RESOURCE
═════════════════════════════════════════════════════════════════════════════

    ┌──────────────────┐
    │ Dr. Osoro Login  │
    └──────┬───────────┘
           │
           │ POST /api/resources
           │ (unit: CS201, type: "assignment", file: "math_assignment.pdf")
           ▼
    ┌──────────────────┐
    │ RESOURCES TABLE  │
    ├──────────────────┤
    │ id: res-1        │
    │ unit_id: CS201   │
    │ lecturer_id:...  │
    │ type: assignment │
    │ title: "Math..." │
    │ file_path: "..." │
    └──────────────────┘


STEP 3: STUDENT SUBMITS ASSIGNMENT
═════════════════════════════════════════════════════════════════════════════

    ┌──────────────────┐
    │ Clem Login       │
    └──────┬───────────┘
           │
           │ GET /api/resources  (for CS201)
           │ ↓ Shows uploaded assignment ✓
           │
           │ POST /api/submissions/submit
           │ (resource: res-1, file: "my_solution.pdf")
           ▼
    ┌────────────────────────────────────────┐
    │ SUBMISSIONS TABLE                      │
    ├────────────────────────────────────────┤
    │ id: sub-1                              │
    │ student_id: Clem                       │
    │ resource_id: res-1                     │
    │ file_path: "uploads/my_solution.pdf"   │
    │ status: "submitted"       ← Key field  │
    │ extracted_text: "Lorem..." (from PDF)  │
    │ plagiarism_percentage: null (pending)  │
    │ ai_score: null (pending)               │
    │ created_at: "2025-03-10T12:30:00Z"     │
    └────────────────────────────────────────┘
           │
           │ Backend triggers analysis
           ▼
    ┌─────────────────────────────────┐
    │ Plagiarism Analysis Service     │
    │ (Copyleaks API)                 │
    │ ↓                               │
    │ plagiarism_percentage: 12.5%    │
    └─────────────────────────────────┘
           │
           │ Updates submission
           ▼
    ┌─────────────────────────────────┐
    │ AI Detection Service            │
    │ (Winston API)                   │
    │ (text length > 300 chars)       │
    │ ↓                               │
    │ ai_score: 8.3%                  │
    └─────────────────────────────────┘
           │
           │ Updates submission
           ▼
    ┌────────────────────────────────────────┐
    │ SUBMISSIONS (UPDATED)                  │
    ├────────────────────────────────────────┤
    │ ... (as above, plus:)                  │
    │ plagiarism_percentage: 12.5            │
    │ ai_score: 8.3                          │
    │ status: "submitted"  ← Ready for grade │
    └────────────────────────────────────────┘


STEP 4: LECTURER VIEWS & GRADES SUBMISSION
═════════════════════════════════════════════════════════════════════════════

    ┌──────────────────────────────┐
    │ Dr. Osoro Dashboard          │
    │ Click "Student Submissions"  │
    └──────┬───────────────────────┘
           │
           │ GET /api/lecturers/submissions
           │ (Backend query flow:)
           │
           ├─→ Get assignments where lecturer_id = Dr.Osoro
           │   ↓ FROM lecturer_unit_assignments
           │   → Returns units: [CS201, ...]
           │
           ├─→ Get resources for units [CS201, ...]
           │   ↓ FROM resources
           │   → Returns: [res-1, ...]
           │
           ├─→ Get submissions for resources [res-1, ...]
           │   ↓ FROM submissions
           │   ↓ WHERE status = "submitted"
           │   → Returns: [sub-1 with plagiarism & AI scores]
           │
           ▼
    ┌────────────────────────────────────────┐
    │ LECTURER DASHBOARD - CS201 TAB         │
    ├────────────────────────────────────────┤
    │ "Operating Systems" (CS201)            │
    │                                        │
    │ Submission Card:                       │
    │ ┌──────────────────────────────────┐   │
    │ │ Student: j77-3860-2023           │   │
    │ │ Assignment: "Assignment 1"       │   │
    │ │ Date: 2025-03-10                 │   │
    │ │                                  │   │
    │ │ Plagiarism: 12.5% [====]  🟢 OK  │   │
    │ │ AI Score:    8.3%  [==]   🟢 OK  │   │
    │ │                                  │   │
    │ │ [View] [Grade]                   │   │
    │ └──────────────────────────────────┘   │
    └────────────────────────────────────────┘
           │
           ├─→ Clicks [View]
           │   ↓ GET /api/submissions/sub-1
           │   ↓ Modal shows extracted text + scores
           │
           └─→ Clicks [Grade]
               ↓ Grade Dialog opens
               ├─→ Enter Grade: 42
               ├─→ Enter Feedback: "Good work but needs..."
               ├─→ Click [Save Grade]
               │
               ▼
             POST /api/submissions/sub-1/grade
             { "grade": 42, "feedback": "..." }
               │
               ▼
    ┌────────────────────────────────────────┐
    │ SUBMISSIONS (FINAL)                    │
    ├────────────────────────────────────────┤
    │ id: sub-1                              │
    │ grade: 42                 ← Updated    │
    │ feedback: "Good work..." ← Updated     │
    │ status: "graded"         ← Updated     │
    │ plagiarism_percentage: 12.5            │
    │ ai_score: 8.3                          │
    └────────────────────────────────────────┘
               │
               ▼ Refresh Page
    ┌────────────────────────────────────────┐
    │ SUBMISSION CARD (UPDATED)              │
    ├────────────────────────────────────────┤
    │ Student: j77-3860-2023                 │
    │ Assignment: "Assignment 1"             │
    │ Date: 2025-03-10                       │
    │                                        │
    │ Grade: 42/100 📊                       │
    │                                        │
    │ Plagiarism: 12.5% [====]  🟢 OK        │
    │ AI Score:    8.3%  [==]   🟢 OK        │
    │                                        │
    │ [View] [Grade]                         │
    └────────────────────────────────────────┘


═════════════════════════════════════════════════════════════════════════════
                              KEY TABLES & FLOWS
═════════════════════════════════════════════════════════════════════════════

lecturer_unit_assignments ←─→ lecturers
        ↓                          ↓
        ├─→ Tells system: "Dr.Osoro teaches CS201"
        │   • Enables lecturer to see CS201 submissions
        │   • Authorizes lecturer to upload resources to CS201
        │   • Authorizes lecturer to grade submissions for CS201
        │
        └─→ units

student_unit_registrations ←─→ students
        ↓                          ↓
        ├─→ Tells system: "Clem is taking CS201"
        │   • Shows CS201 resources to Clem
        │   • Allows Clem to submit for CS201 assignments
        │
        └─→ units

resources ←──── uploaded by lecturers, belongs to unit
    ↓
    └─→ Has many submissions (student submissions to this resource)

submissions ←── Has many analyses
    ├─→ plagiarism_analysis (scores from Copyleaks)
    ├─→ ai_detection_reports (scores from Winston)
    └─→ Grade & feedback from lecturer


═════════════════════════════════════════════════════════════════════════════
                          CRITICAL CONSTRAINTS
═════════════════════════════════════════════════════════════════════════════

1. lecturer_unit_assignments MUST have a row for lecturer+unit
   → Without it, lecturer sees nothing on dashboard

2. student_unit_registrations MUST have a row for student+unit
   → Without it, student doesn't see the unit's resources

3. resources MUST have lecturer_id pointing to teaching lecturer
   → Enforced by policy: lecturers can only upload to their units

4. submissions.status = "submitted"
   → Only "submitted" submissions appear in lecturer dashboard
   → Other statuses: "draft", "graded"

5. Plagiarism requires text from PDF > 300 characters (Winston API minimum)
   → If fails, ai_score remains null or 0
   → Scanned PDFs handled with helpful error messages

6. PDF extraction must succeed
   → Without extracted_text, no AI analysis can run
   → Backend detects scanned PDFs and throws user-friendly error
```

## Data Dependencies

```
For Dr.Osoro to grade Clem's submission:

1️⃣  Lecturers Table
    lecturer_id: osoro-uuid
    staff_number: "001"
    
    ↓ Referenced by ↓

2️⃣  Lecturer_Unit_Assignments Table
    lecturer_id: osoro-uuid ← Must exist!
    unit_id: cs201-uuid

    ↓ Paired with ↓

3️⃣  Student_Unit_Registrations Table
    student_id: clem-uuid
    unit_id: cs201-uuid ← Must be SAME unit!

    ↓ Links student to ↓

4️⃣  Resources Table
    unit_id: cs201-uuid
    lecturer_id: osoro-uuid

    ↓ Submitted to ↓

5️⃣  Submissions Table
    student_id: clem-uuid
    resource_id: resource-uuid
    status: "submitted"
    plagiarism_percentage: (filled by API)
    ai_score: (filled by API)

    ↓ Then lecturer can ↓

6️⃣  Grade via POST /api/submissions/{id}/grade
    Updates:
    - grade: 42
    - feedback: "..."
    - status: "graded"
```

---

For visual representation in the app, the lecturer sees a tree like:

```
Student Submissions
├─ CS201 (Operating Systems) ← TAB
│  ├─ Submission from Clem
│  │  ├─ Plagiarism: 12.5% 🟢
│  │  ├─ AI Score: 8.3% 🟢
│  │  ├─ Grade: 42 (after grading)
│  │  ├─ [View] → Shows extracted text + scores
│  │  └─ [Grade] → Opens dialog to enter grade
│  │
│  └─ Submission from (other student)
│     ├─ Plagiarism: 45% 🔴
│     ├─ AI Score: 35% 🔴
│     ├─ Grade: - (not graded)
│     ├─ [View]
│     └─ [Grade]
│
├─ CS102 (Another Unit) ← TAB
│  └─ (submissions for that unit)
│
└─ CS105 ← TAB
   └─ (no submissions yet)
```
