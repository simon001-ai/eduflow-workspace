# 🚀 QUICK START: Lecturer Unit Assignments

## What's Changed

✅ **Database:** Migration `007_setup_osoro_operating_systems.sql` creates lecturer-unit relationships  
✅ **Backend:** Updated `getLecturerSubmissions()` to fetch full submission details (AI scores, grades, feedback)  
✅ **Backend:** Added new endpoint `GET /api/submissions/{id}` to view submission details  
✅ **Frontend:** Already integrated in previous session - ready to display submissions  

## Setup in 5 Minutes

### Step 1: Run the Seeder Script

```bash
cd backend
node database/seeders/setup-unit-assignments.js
```

**Output will show:**
```
✅ Database setup complete!

📋 Next Steps:
1. Login as Dr.osoro (staff_number: 001, password: 098765)
2. Upload a resource to the "Operating Systems" unit
3. Login as Clem (j77-3860-2023, password: 123456)
4. Submit the assignment
5. Login back as Dr.osoro
6. Go to "Student Submissions" and grade the submission
```

### Step 2: Start Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm install (if needed)
node --watch src/server.js
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install (if needed)
npm run dev
```

#### Step 3: Test the Complete Flow

##### 3.1 Upload Assignment (as Lecturer)

1. Open frontend (usually `http://localhost:5173`)
2. Login as Lecturer:
   - Staff Number: `001`
   - Password: `098765`
3. Click "Resources" or dashboard resource upload
4. Select unit: **CS201 - Operating Systems**
5. Upload a PDF or Word document as an assignment
6. Save

##### 3.2 Submit Assignment (as Student)

1. Open **new private browser window** (or logout and login as different user)
2. Login as Student:
   - Admission Number: `j77-3860-2023`
   - Password: `123456`
3. Find your units/resources - should see **CS201 - Operating Systems**
4. Find the assignment you just uploaded
5. Submit a file (PDF, Word, or text)
6. System will:
   - Extract text
   - Run plagiarism check
   - Run AI detection
   - Show status "Submitted"

##### 3.3 View & Grade (as Lecturer)

1. Return to lecturer window
2. Navigate to **Student Submissions**
3. You should see the **CS201** tab
4. Click the tab - Clem's submission appears below
5. Click **"View"** to see:
   - Extracted text from PDF
   - Plagiarism percentage with color-coded risk
   - AI detection score with color-coded risk
6. Click **"Grade"**:
   - Enter grade (0-100) - example: `42`
   - Add feedback - example: "Good attempt but needs work on..."
   - Click "Save Grade"
7. Submission card now shows the grade badge

## Database Schema

**No new tables needed!** The `lecturer_unit_assignments` table already exists.

What was created:
- **Unit:** CS201 - Operating Systems (Semester 2, 2025/2026)
- **Registration:** Clem registered to CS201
- **Assignment:** Dr. Osoro assigned to teach CS201

## API Endpoints

### GET `/api/lecturers/submissions`  
**Return format:**
```json
{
  "success": true,
  "units": [
    {
      "unit_id": "uuid",
      "code": "CS201",
      "name": "Operating Systems",
      "submissions": [
        {
          "id": "sub-uuid",
          "student_id": "student-uuid",
          "resource_title": "Assignment 1",
          "resource_type": "assignment",
          "plagiarism_percentage": 12.5,
          "ai_score": 8.3,
          "grade": 85,
          "feedback": "Good work!",
          "extracted_text": "Lorem ipsum...",
          "status": "submitted",
          "created_at": "2025-03-10T12:30:00Z"
        }
      ]
    }
  ]
}
```

### GET `/api/submissions/{id}` ✨ NEW
**Return format:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "student_id": "uuid",
    "resource_title": "Assignment 1",
    "resource_type": "assignment",
    "plagiarism_percentage": 12.5,
    "ai_score": 8.3,
    "grade": 85,
    "feedback": "Good work!",
    "extracted_text": "Lorem ipsum...",
    "status": "submitted",
    "created_at": "2025-03-10T12:30:00Z"
  }
}
```

### POST `/api/submissions/{id}/grade`
**Request:**
```json
{
  "grade": 85,
  "feedback": "Excellent work!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "grade": 85,
    "feedback": "Excellent work!",
    "status": "graded"
  }
}
```

## File Changes Summary

| File | Change | Impact |
|------|--------|--------|
| `backend/modules/lecturers/lecturer.controller.js` | Updated `getLecturerSubmissions()` | Now fetches ai_score, grade, feedback, extracted_text, status |
| `backend/modules/submissions/submission.routes.js` | Added `GET /:id` route | New endpoint for viewing submission details |
| `backend/modules/submissions/submission.controller.js` | Added `getSubmissionDetails()` | Handler for viewing submission details |
| `backend/database/migrations/007_setup_osoro_operating_systems.sql` | New migration | Sets up unit, student registration, lecturer assignment |
| `backend/database/seeders/setup-unit-assignments.js` | New seeder script | Quick setup without manual SQL |

## Troubleshooting

### Q: I don't see any units in lecturer dashboard
**A:** Make sure you ran the seeder script. Check that Dr. Osoro exists and is assigned to CS201:
```sql
SELECT * FROM lecturer_unit_assignments 
WHERE lecturer_id = (SELECT id FROM lecturers WHERE staff_number = '001');
```

### Q: Student doesn't see the assignment to submit
**A:** Verify:
1. Student is registered to the unit (check student_unit_registrations)
2. Resource was created for that unit (check resources table)
3. Resource was created by the lecturer who teaches that unit

### Q: Plagiarism/AI scores show as 0
**A:** 
1. PDF extraction might have failed - check extracted_text has content
2. AI detection needs text > 300 characters
3. Check backend logs for "Plagiarism analysis completed"

### Q: Grade doesn't appear after saving
**A:** 
1. Check browser developer console for API errors
2. Verify backend returned success response
3. Try refreshing the page

## Next Steps

1. ✅ Run the seeder script
2. ✅ Test the full submission → grading flow
3. ✅ Verify grades persist on page refresh
4. 📝 Create more units with different lecturers
5. 📝 Create integration tests for the API
6. 📝 Add batch grading functionality
7. 📝 Add grade templates/rubrics

## Files to Review

- [Database Setup Guide](./DATABASE_SETUP_GUIDE.md)
- [Course Schema Overview](./backend/database/SCHEMA_OVERVIEW.md)
- [Backend API Implementation](./backend/IMPLEMENTATION_COMPLETE.md)
- [Lecturer Controller](./backend/modules/lecturers/lecturer.controller.js)

---

🎉 **You're all set!** Follow the 5-minute setup above and you'll have a full lecturer→student→submission→grading workflow.
