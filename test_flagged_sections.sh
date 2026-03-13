#!/bin/bash

# EduFlow Connect - Flagged Sections Testing Script
# This script tests the new flagged sections functionality

echo "🚀 EduFlow Connect - Flagged Sections Testing"
echo "=============================================="

# Check if backend is running
echo "📡 Checking if backend is running..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is not running. Please start it with 'npm run dev' in the backend directory"
    exit 1
fi

# Test student login
echo ""
echo "🔐 Testing student login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/student/login \
  -H "Content-Type: application/json" \
  -d '{"admission_number": "j77-3860-2023", "password": "123456"}')

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Student login successful"
    STUDENT_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    echo "📝 Token obtained: ${STUDENT_TOKEN:0:20}..."
else
    echo "❌ Student login failed"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

# Check for test PDF file
echo ""
echo "📄 Checking for test file..."
if [ -f "backend/uploads/test-document.pdf" ]; then
    TEST_FILE="backend/uploads/test-document.pdf"
    echo "✅ Using existing test file: $TEST_FILE"
elif [ -f "backend/uploads/sample.pdf" ]; then
    TEST_FILE="backend/uploads/sample.pdf"
    echo "✅ Using sample file: $TEST_FILE"
else
    echo "⚠️  No test PDF found. Please ensure you have a PDF file in backend/uploads/"
    echo "   You can test manually using the Postman collection instead."
    exit 1
fi

# Test document upload and analysis
echo ""
echo "📤 Testing document upload and analysis..."
UPLOAD_RESPONSE=$(curl -s -X POST http://localhost:3000/api/plagiarism/analyze \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -F "file=@$TEST_FILE" \
  -F "resource_id=66666666-6666-6666-6666-666666666666" \
  -F "student_id=820fa2d2-1cf2-42f3-ac6a-27a4418f9f95")

if echo "$UPLOAD_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Document upload successful"
    SUBMISSION_ID=$(echo "$UPLOAD_RESPONSE" | grep -o '"submission_id":"[^"]*' | cut -d'"' -f4)
    echo "📝 Submission ID: $SUBMISSION_ID"
else
    echo "❌ Document upload failed"
    echo "Response: $UPLOAD_RESPONSE"
    exit 1
fi

# Poll for analysis results
echo ""
echo "🔍 Polling for analysis results (this may take 10-30 seconds)..."
MAX_ATTEMPTS=30
ATTEMPT=1

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    echo "Attempt $ATTEMPT/$MAX_ATTEMPTS..."

    ANALYSIS_RESPONSE=$(curl -s -X GET "http://localhost:3000/api/plagiarism/analyze/result/$SUBMISSION_ID" \
      -H "Authorization: Bearer $STUDENT_TOKEN")

    if echo "$ANALYSIS_RESPONSE" | grep -q '"success":true' && echo "$ANALYSIS_RESPONSE" | grep -q '"submission_id"'; then
        echo "✅ Analysis completed successfully!"

        # Extract key metrics
        AI_SCORE=$(echo "$ANALYSIS_RESPONSE" | grep -o '"ai_probability":[0-9.]*' | cut -d':' -f2)
        PLAGIARISM_SCORE=$(echo "$ANALYSIS_RESPONSE" | grep -o '"plagiarism_percentage":[0-9.]*' | cut -d':' -f2)

        echo "📊 Results:"
        echo "   - AI Probability: ${AI_SCORE}%"
        echo "   - Plagiarism Score: ${PLAGIARISM_SCORE}%"

        # Check for flagged sections
        if echo "$ANALYSIS_RESPONSE" | grep -q '"matches":\['; then
            MATCHES_COUNT=$(echo "$ANALYSIS_RESPONSE" | grep -o '"matches":\[[^]]*\]' | grep -o '"type":' | wc -l)
            echo "   - Flagged Sections: $MATCHES_COUNT sections found"

            # Show flagged sections summary
            if echo "$ANALYSIS_RESPONSE" | grep -q '"type":"ai_detected"'; then
                AI_COUNT=$(echo "$ANALYSIS_RESPONSE" | grep -o '"type":"ai_detected"' | wc -l)
                echo "     • AI-detected: $AI_COUNT sections"
            fi

            if echo "$ANALYSIS_RESPONSE" | grep -q '"type":"plagiarism"'; then
                PLAG_COUNT=$(echo "$ANALYSIS_RESPONSE" | grep -o '"type":"plagiarism"' | wc -l)
                echo "     • Plagiarism: $PLAG_COUNT sections"
            fi
        else
            echo "   - Flagged Sections: None found"
        fi

        # Check for recommendations
        if echo "$ANALYSIS_RESPONSE" | grep -q '"recommendations":\['; then
            REC_COUNT=$(echo "$ANALYSIS_RESPONSE" | grep -o '"recommendations":\[[^]]*\]' | grep -o '"[^"]*"' | wc -l)
            echo "   - Recommendations: $((REC_COUNT/2)) suggestions provided"
        fi

        echo ""
        echo "🎉 Testing completed successfully!"
        echo "📋 Full response saved to: analysis_response.json"
        echo "$ANALYSIS_RESPONSE" > analysis_response.json

        exit 0
    fi

    sleep 2
    ATTEMPT=$((ATTEMPT + 1))
done

echo "❌ Analysis timed out after $MAX_ATTEMPTS attempts"
echo "Response: $ANALYSIS_RESPONSE"
exit 1