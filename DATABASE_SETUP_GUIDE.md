# Database Setup: Lecturer Unit Assignment for Dr. Osoro

## Overview

This guide sets up the system so that:
- **Student (Clem)** is registered for the unit **Operating Systems Semester 2**
- **Lecturer (Dr. Osoro)** is assigned to teach the same unit
- When Dr. Osoro logs in, they can see Clem's submissions for that unit
- Dr. Osoro can grade those submissions

## Prerequisites

- Backend running with Supabase connection
- Test users already seeded (or seed them with `npm run seed:users`)
- Supabase project URL and Service Role Key in `.env`

## Step 1: Review Current Test Data

Your existing test credentials:

**Student:**
- Name: isho clem
- Admission Number: `j77-3860-2023`
- Password: `123456`
- Email: `j77-3860-2023@student.mksu.ac.ke`

**Lecturer:**
- Name: DR.osoro
- Staff Number: `001`
- Password: `098765`
- Email: `njoroogu@gmail.com`

## Step 2: Execute Migration SQL

The migration file is located at: `/backend/database/migrations/007_setup_osoro_operating_systems.sql`

### Option A: Run via Supabase Dashboard

1. Navigate to **SQL Editor** in your Supabase dashboard
2. Click **New Query**
3. Copy the contents of `007_setup_osoro_operating_systems.sql`
4. Execute the query
5. Check the output for any errors

### Option B: Run via psql CLI (if you have direct database access)

```bash
psql postgresql://[user]:[password]@[host]:[port]/[database] < /backend/database/migrations/007_setup_osoro_operating_systems.sql
```

### Option C: Create a Node.js Seeder Script

Create a new file: `/backend/database/seeders/setup-unit-assignments.js`

```javascript
import '../../src/config/env.js';
import { getSupabase } from '../../src/config/supabaseClient.js';

async function run() {
  try {
    const supabase = getSupabase();

    // 1. Create the unit
    const { data: unitData, error: unitError } = await supabase
      .from('units')
      .upsert({
        name: 'Operating Systems',
        code: 'CS201',
        semester: 'Semester 2',
        academic_year: '2025/2026'
      }, { onConflict: 'code' })
      .select('id')
      .single();

    if (unitError && unitError.code !== '23505') throw unitError;
    const unitId = unitData.id;
    console.log('✓ Unit created/verified: CS201 - Operating Systems');

    // 2. Get student ID
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('admission_number', 'j77-3860-2023')
      .single();
    if (studentError) throw studentError;
    console.log('✓ Student found: Clem (j77-3860-2023)');

    // 3. Register student to unit
    const { error: regError } = await supabase
      .from('student_unit_registrations')
      .insert({
        student_id: student.id,
        unit_id: unitId,
        semester: 'Semester 2',
        academic_year: '2025/2026'
      })
      .select();
    
    if (regError && regError.code !== '23505') throw regError;
    console.log('✓ Student registered to unit');

    // 4. Get lecturer ID
    const { data: lecturer, error: lecturerError } = await supabase
      .from('lecturers')
      .select('id')
      .eq('staff_number', '001')
      .single();
    if (lecturerError) throw lecturerError;
    console.log('✓ Lecturer found: Dr.osoro (001)');

    // 5. Assign lecturer to unit
    const { error: assignError } = await supabase
      .from('lecturer_unit_assignments')
      .insert({
        lecturer_id: lecturer.id,
        unit_id: unitId,
        semester: 'Semester 2',
        academic_year: '2025/2026'
      })
      .select();
    
    if (assignError && assignError.code !== '23505') throw assignError;
    console.log('✓ Lecturer assigned to unit');

    console.log('\n✅ Database setup complete!');
    console.log('\nNow you can:');
    console.log('1. Login as Dr.osoro (staff_number: 001, password: 098765)');
    console.log('2. View Clem\'s submissions in Student Submissions');
    console.log('3. Upload resources to the "Operating Systems" unit');
    console.log('4. Have Clem submit assignments');
    console.log('5. Grade Clem\'s submissions');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

run();
```

Then run:
```bash
cd backend
node database/seeders/setup-unit-assignments.js
```

## Step 3: Verify the Setup

Run these verification queries in Supabase SQL Editor:

### Check the Unit
```sql
SELECT id, name, code, semester, academic_year 
FROM units 
WHERE code = 'CS201';
```

**Expected output:**
```
id                                   | name              | code  | semester    | academic_year
12345678-1234-1234-1234-123456789012 | Operating Systems | CS201 | Semester 2  | 2025/2026
```

### Check Student Registration
```sql
SELECT s.fullname, u.code, u.name, sr.semester, sr.academic_year
FROM student_unit_registrations sr
JOIN students s ON sr.student_id = s.id
JOIN units u ON sr.unit_id = u.id
WHERE s.admission_number = 'j77-3860-2023';
```

**Expected output:**
```
fullname  | code  | name              | semester    | academic_year
isho clem | CS201 | Operating Systems | Semester 2  | 2025/2026
```

### Check Lecturer Assignment
```sql
SELECT l.full_name, u.code, u.name, lua.semester, lua.academic_year
FROM lecturer_unit_assignments lua
JOIN lecturers l ON lua.lecturer_id = l.id
JOIN units u ON lua.unit_id = u.id
WHERE l.staff_number = '001';
```

**Expected output:**
```
full_name | code  | name              | semester    | academic_year
DR.osoro  | CS201 | Operating Systems | Semester 2  | 2025/2026
```

## Step 4: Test the Setup in Frontend

### 4.1 Upload a Resource as Lecturer

1. Start both backend and frontend servers
2. Login as lecturer:
   - Staff Number: `001`
   - Password: `098765`
3. Click "Resources" or "Upload Resource"
4. Select unit: **CS201 - Operating Systems**
5. Upload a document (PDF, Word, etc.) as an assignment
6. The resource is now available for students in that unit

### 4.2 Submit Assignment as Student

1. In a new browser window/private tab, login as student:
   - Admission Number: `j77-3860-2023`
   - Password: `123456`
2. Find your resources/assignments - should see the uploaded resource
3. Submit the assignment file
4. Backend will:
   - Extract text from PDF/document
   - Analyze for plagiarism
   - Analyze for AI content
   - Save submission with status "submitted"

### 4.3 Grade as Lecturer

1. Return to lecturer login window
2. Click "Student Submissions" in sidebar
3. See the unit tabs - click on **CS201**
4. See Clem's submission appear
5. Click "View Submission" to see:
   - Extracted text
   - Plagiarism percentage
   - AI detection percentage
6. Click "Grade" to:
   - Enter grade (0-100)
   - Add feedback
   - Save
7. Grade appears on submission card

## Step 5: Backend API Changes

The following API endpoint has been updated:

### Updated: `GET /api/lecturers/submissions`

**Response now includes:**
```json
{
  "success": true,
  "units": [
    {
      "unit_id": "uuid",
      "name": "Operating Systems",
      "code": "CS201",
      "submissions": [
        {
          "id": "uuid",
          "student_id": "uuid",
          "resource_id": "uuid",
          "file_path": "path/to/file.pdf",
          "plagiarism_percentage": 12.50,
          "ai_score": 8.30,
          "grade": 85,
          "feedback": "Good work!",
          "extracted_text": "Lorem ipsum...",
          "status": "submitted",
          "created_at": "2025-03-10T12:30:00Z",
          "resource_title": "Assignment 1",
          "resource_type": "assignment"
        }
      ]
    }
  ]
}
```

### New: `GET /api/submissions/{id}`

**Fetches individual submission details:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "student_id": "uuid",
    "resource_id": "uuid",
    "file_path": "path/to/file.pdf",
    "plagiarism_percentage": 12.50,
    "ai_score": 8.30,
    "grade": 85,
    "feedback": "Good work!",
    "extracted_text": "Lorem ipsum...",
    "status": "submitted",
    "created_at": "2025-03-10T12:30:00Z",
    "resource_title": "Assignment 1",
    "resource_type": "assignment"
  }
}
```

## Database Schema Changes

No schema changes needed! The table `lecturer_unit_assignments` already exists in migration `001_initial_schema.sql` with columns:
- `id` (UUID, primary key)
- `lecturer_id` (FK to lecturers)
- `unit_id` (FK to units)
- `semester` (TEXT)
- `academic_year` (TEXT)
- `assigned_at` (TIMESTAMPTZ)
- Unique constraint on `(lecturer_id, unit_id, semester, academic_year)`

## Troubleshooting

### Problem: Lecturer sees no units/submissions

**Solution:**
1. Verify lecturer_unit_assignments has a row for the lecturer:
```sql
SELECT * FROM lecturer_unit_assignments WHERE lecturer_id = (SELECT id FROM lecturers WHERE staff_number = '001');
```
2. Ensure the unit_id in that row exists in units table
3. Check that submissions exist for resources in that unit with status = 'submitted'

### Problem: Student doesn't see uploaded resources

**Solution:**
1. Verify student_unit_registrations has a row for the student and unit:
```sql
SELECT * FROM student_unit_registrations WHERE student_id = (SELECT id FROM students WHERE admission_number = 'j77-3860-2023') AND unit_id = (SELECT id FROM units WHERE code = 'CS201');
```
2. Verify resources exist for that unit with the correct unit_id
3. Clear browser cache and refresh

### Problem: Plagiarism/AI scores are 0

**Solution:**
1. Check PDF extraction worked - extract_text should have content
2. Check plagiarism analysis completed - logs should show "Plagiarism analysis complete"
3. Check AI analysis - requires text > 300 characters

## Summary

You now have:
✅ Operating Systems Semester 2 unit created  
✅ Student Clem registered to the unit  
✅ Lecturer Dr. Osoro assigned to teach the unit  
✅ Complete submission viewing and grading workflow  
✅ All AI detection and plagiarism analysis integrated  

Ready to test the full end-to-end flow!
