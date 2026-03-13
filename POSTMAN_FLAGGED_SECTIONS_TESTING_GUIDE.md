# EduFlow Connect - Testing Flagged Sections Feature

## Overview
This guide helps you test the new flagged sections functionality that shows specific problematic parts of documents after AI detection and plagiarism analysis.

## Prerequisites
1. Backend server running on `http://localhost:3000`
2. Frontend running (optional, but recommended for full testing)
3. Postman installed
4. A PDF document to test with

## Testing Steps

### Step 1: Import Updated Postman Collection
1. Open Postman
2. Import the file: `EduFlow_Submission_Test_Updated.postman_collection.json`
3. The collection includes 7 requests for complete testing

### Step 2: Student Login
- **Request**: `1. Student Login`
- **Method**: POST
- **URL**: `http://localhost:3000/api/auth/student/login`
- **Body**:
```json
{
  "admission_number": "j77-3860-2023",
  "password": "123456"
}
```
- **Expected Response**: JWT token in `token` field
- **Action**: Copy the token and set it as `student_token` variable in Postman

### Step 3: Upload & Analyze Document
- **Request**: `2. Upload & Analyze Document`
- **Method**: POST
- **URL**: `http://localhost:3000/api/plagiarism/analyze`
- **Headers**: `Authorization: Bearer {{student_token}}`
- **Body**: Form-data with:
  - `file`: Select a PDF file
  - `resource_id`: `66666666-6666-6666-6666-666666666666`
  - `student_id`: `820fa2d2-1cf2-42f3-ac6a-27a4418f9f95`
- **Expected Response**: `submission_id` in the response
- **Action**: Copy the `submission_id` and set it as the `submission_id` variable

### Step 4: Poll for Analysis Results (NEW - Key Test)
- **Request**: `3. Poll Analysis Results (Check Flagged Sections)`
- **Method**: GET
- **URL**: `http://localhost:3000/api/plagiarism/analyze/result/{{submission_id}}`
- **Headers**: `Authorization: Bearer {{student_token}}`
- **Expected Response**: Analysis results with flagged sections

**What to look for in the response:**
```json
{
  "success": true,
  "submission_id": "...",
  "ai_score": 45.5,
  "ai_probability": 45.5,
  "human_probability": 54.5,
  "plagiarism_percentage": 12.3,
  "matches": [
    {
      "type": "ai_detected",
      "text": "This sentence appears to be AI-generated content...",
      "ai_probability": 85,
      "human_probability": 15
    },
    {
      "type": "plagiarism",
      "text": "This text matches previous submissions...",
      "similarity": 78,
      "source": "Previous submission"
    }
  ],
  "recommendations": [
    "Consider rephrasing sections with high similarity to avoid plagiarism concerns.",
    "Review AI-generated content and ensure it aligns with your institution's policies."
  ]
}
```

### Step 5: Submit to Lecturer (Optional)
- **Request**: `4. Submit Document to Lecturer`
- **Method**: POST
- **URL**: `http://localhost:3000/api/submissions/submit`
- **Headers**: `Authorization: Bearer {{student_token}}`
- **Body**:
```json
{
  "submission_id": "{{submission_id}}",
  "resource_id": "66666666-6666-6666-6666-666666666666",
  "student_id": "820fa2d2-1cf2-42f3-ac6a-27a4418f9f95"
}
```

### Step 6: Lecturer Testing (Optional)
- **Request**: `5. Lecturer Login` - Get lecturer token
- **Request**: `6. Lecturer View Submissions` - View submitted documents

### Step 7: Get Detailed Submission Info (Optional)
- **Request**: `7. Get Submission Details (with Flagged Sections)`
- **Method**: GET
- **URL**: `http://localhost:3000/api/submissions/{{submission_id}}`
- **Headers**: `Authorization: Bearer {{student_token}}`
- **Expected**: Same flagged sections data as in step 4

## Key Features to Test

### 1. Flagged Sections Display
- **AI-detected sections**: Sentences with >70% AI probability
- **Plagiarism sections**: Text segments with >15% similarity
- **Visual differentiation**: Each section shows type (AI vs Plagiarism)

### 2. Recommendations
- Context-aware suggestions based on analysis results
- Different recommendations for high plagiarism vs high AI content

### 3. Frontend Integration
- Flagged sections appear in the UI before submission
- Students can review and decide whether to revise or submit

## Troubleshooting

### No Flagged Sections Appearing
- Ensure your test document has detectable AI content or plagiarism
- Check that the document is long enough (>300 characters for AI detection)
- Verify the analysis completed successfully

### Analysis Taking Too Long
- The analysis may take 10-30 seconds depending on document length
- Keep polling the results endpoint until you get the flagged sections

### Authentication Errors
- Ensure you're using the correct JWT tokens
- Check that the student/lecturer credentials are valid

## Expected Response Structure

The key addition is the `matches` array containing flagged sections:

```json
"matches": [
  {
    "type": "ai_detected",
    "text": "Flagged sentence text...",
    "ai_probability": 85,
    "human_probability": 15
  },
  {
    "type": "plagiarism",
    "text": "Matching text segment...",
    "similarity": 78,
    "source": "Previous submission"
  }
]
```

This data is now displayed in the frontend UI, allowing students to see exactly which parts of their document need attention before submission.