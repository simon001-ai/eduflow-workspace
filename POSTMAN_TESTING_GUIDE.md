# Postman Testing Guide: Submission & Notification Flow

## Overview
This guide tests the complete flow from student document submission to lecturer seeing the submitted document.

---

## Step 1: Student Login

**Endpoint**: `POST http://localhost:3000/api/auth/student/login`

**Headers**:
```
Content-Type: application/json
```

**Body** (raw JSON):
```json
{
  "admission_number": "j77-3860-2023",
  "password": "123456"
}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "820fa2d2-1cf2-42f3-ac6a-27a4418f9f95",
      "admission_number": "j77-3860-2023",
      "fullname": "isho clem",
      "email": "j77-3860-2023@student.mksu.ac.ke"
    }
  }
}
```

**Save**: Copy the `token` value for use in subsequent requests
**Note**: Keep track of `student_id` = `820fa2d2-1cf2-42f3-ac6a-27a4418f9f95`

---

## Step 2: Upload & Analyze Document

**Endpoint**: `POST http://localhost:3000/api/plagiarism/analyze`

**Headers**:
```
Authorization: Bearer {token-from-step-1}
Content-Type: multipart/form-data
```

**Body** (form-data):
- `file`: [Select a PDF file with extractable text]
- `resource_id`: `66666666-6666-6666-6666-666666666666` (assignment ID)
- `student_id`: `820fa2d2-1cf2-42f3-ac6a-27a4418f9f95`

**Expected Response**:
```json
{
  "success": true,
  "submission_id": "550e8400-e29b-41d4-a716-446655440000",
  "ai_score": 15.5,
  "plagiarism_score": 0,
  "message": "Submission analyzed successfully"
}
```

**Save**: Copy `submission_id` for the next step

---

## Step 3: Submit Document to Lecturer

**Endpoint**: `POST http://localhost:3000/api/submissions/submit`

**Headers**:
```
Authorization: Bearer {token-from-step-1}
Content-Type: application/json
```

**Body** (raw JSON):
```json
{
  "submission_id": "550e8400-e29b-41d4-a716-446655440000",
  "resource_id": "66666666-6666-6666-6666-666666666666",
  "student_id": "820fa2d2-1cf2-42f3-ac6a-27a4418f9f95"
}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Document submitted successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "student_id": "820fa2d2-1cf2-42f3-ac6a-27a4418f9f95",
    "resource_id": "66666666-6666-6666-6666-666666666666",
    "status": "submitted",
    "plagiarism_percentage": 0,
    "ai_score": 15.5
  }
}
```

**Check**: Verify you get `"success": true`

---

## Step 4: Verify in Database - Check Submissions

**Using Supabase Dashboard**:
1. Go to https://supabase.com → Your Project
2. Go to **SQL Editor**
3. Run this query:

```sql
SELECT 
  id,
  student_id,
  resource_id,
  status,
  plagiarism_percentage,
  ai_score,
  created_at
FROM submissions
WHERE resource_id = '66666666-6666-6666-6666-666666666666'
ORDER BY created_at DESC
LIMIT 5;
```

**Expected Result**:
Should show your submission with `status = 'submitted'`

---

## Step 5: Verify Notification Created

**Using Supabase Dashboard** (same SQL Editor):

```sql
SELECT 
  id,
  lecturer_id,
  resource_id,
  type,
  title,
  read_at,
  created_at
FROM lecturer_notifications
ORDER BY created_at DESC
LIMIT 5;
```

**Expected Result**:
Should show a notification with:
- `type = 'assignment_uploaded'`
- `title = 'New submission for [resource title]'`
- Recent `created_at` timestamp

---

## Step 6: Lecturer Login

**Endpoint**: `POST http://localhost:3000/api/auth/lecturer/login`

**Headers**:
```
Content-Type: application/json
```

**Body** (raw JSON):
```json
{
  "staff_number": "001",
  "password": "098765"
}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "11111111-1111-1111-1111-111111111111",
      "staff_number": "LEC001",
      "full_name": "Dr. Lecturer Name"
    }
  }
}
```

**Save**: Copy the `token` for lecturer requests

---

## Step 7: Lecturer Views Submissions

**Endpoint**: `GET http://localhost:3000/api/lecturers/submissions`

**Headers**:
```
Authorization: Bearer {lecturer-token-from-step-6}
Content-Type: application/json
```

**Expected Response**:
```json
{
  "success": true,
  "units": [
    {
      "unit_id": "22222222-2222-2222-2222-222222222222",
      "name": "Data Structures",
      "code": "CS201",
      "submissions": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "student_id": "820fa2d2-1cf2-42f3-ac6a-27a4418f9f95",
          "resource_id": "66666666-6666-6666-6666-666666666666",
          "resource_title": "Assignment 1",
          "resource_type": "assignment",
          "file_path": "uploads/...",
          "plagiarism_percentage": 0,
          "created_at": "2026-03-09T12:34:56Z"
        }
      ]
    }
  ]
}
```

**Check**: Verify your submission appears in the list

---

## Troubleshooting Checklist

### If Step 3 fails:
- [ ] Verify `submission_id` is correct
- [ ] Verify `resource_id` is correct
- [ ] Verify `student_id` matches logged-in student
- [ ] Check backend logs for error details

### If Step 5 shows no notifications:
- [ ] Check that resource has a `lecturer_id`
- [ ] Verify the submission update actually happened (Step 4)
- [ ] Check backend logs: `Error creating lecturer notification:`

### If Step 7 shows no submissions:
- [ ] Verify lecturer teaches the unit (check `lecturer_unit_assignments` table)
- [ ] Verify resource belongs to that unit
- [ ] Verify submission's `status` field is `'submitted'` (Step 4)
- [ ] Check that `resource_id` matches

---

## Common Test Data

| Field | Value |
|-------|-------|
| Student Admission # | j77-3860-2023 |
| Student Password | 123456 |
| Student ID | 820fa2d2-1cf2-42f3-ac6a-27a4418f9f95 |
| Lecturer Staff # | 001 |
| Lecturer Password | 098765 |
| Assignment Resource ID | 66666666-6666-6666-6666-666666666666 |
| Lecturer Full Name | DR.osoro |
| Lecturer Email | njoroogu@gmail.com |

---

## Quick SQL Queries for Debugging

**Check all submissions for a student**:
```sql
SELECT * FROM submissions 
WHERE student_id = '820fa2d2-1cf2-42f3-ac6a-27a4418f9f95'
ORDER BY created_at DESC;
```

**Check all notifications for a lecturer**:
```sql
SELECT * FROM lecturer_notifications 
WHERE lecturer_id = '11111111-1111-1111-1111-111111111111'
ORDER BY created_at DESC;
```

**Check resource ownership**:
```sql
SELECT id, title, unit_id, lecturer_id 
FROM resources 
WHERE id = '66666666-6666-6666-6666-666666666666';
```

**Check lecturer unit assignments**:
```sql
SELECT * FROM lecturer_unit_assignments 
WHERE lecturer_id = '11111111-1111-1111-1111-111111111111';
```

---

## Expected Flow Summary

```
1. Student Login ✅
   ↓
2. Student Uploads & Analyzes Document ✅
   - Creates submission with status='draft'
   - submission_id returned
   ↓
3. Student Submits Document ✅
   - Updates submission status='submitted'
   - Creates lecturer_notification
   - Emits Socket.io event
   ↓
4. Lecturer Logs In ✅
   ↓
5. Lecturer Views Submissions ✅
   - Queries all submissions for their units
   - Shows student submissions
```

---

## What to Check if Submission Doesn't Appear

1. **Is submission created but status not updated?**
   - Check submissions table: `SELECT * FROM submissions`
   - Verify status = 'submitted' (not 'draft')

2. **Is notification created?**
   - Check lecturer_notifications table
   - Verify lecturer_id matches lecturer querying

3. **Does lecturer teach this unit?**
   - Check lecturer_unit_assignments table
   - Query: `SELECT * FROM lecturer_unit_assignments WHERE lecturer_id = '...'`

4. **Does resource belong to lecturer's unit?**
   - Check resources table
   - Verify lecturer_id and unit_id match
