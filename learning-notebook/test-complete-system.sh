#!/bin/bash

# Learning Notebook Complete System Test Script

API_BASE="https://data-manager-auth.t88596565.workers.dev"

echo "=== Learning Notebook Complete System Test ==="
echo "Testing all functionality with new integrated worker"
echo

# Helper function for colored output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_passed() {
    echo -e "${GREEN}✅ $1${NC}"
}

test_failed() {
    echo -e "${RED}❌ $1${NC}"
}

test_info() {
    echo -e "${YELLOW}🔍 $1${NC}"
}

# Store timestamps for unique test data
TIMESTAMP=$(date +%s)

echo "Timestamp for this test run: $TIMESTAMP"
echo

# Test 1: Health Check
test_info "1. Testing health endpoint..."
HEALTH=$(curl -s "$API_BASE/api/health")
if echo "$HEALTH" | grep -q '"status":"ok"'; then
    test_passed "Health check passed"
    echo "Service: $(echo "$HEALTH" | grep -o '"service":"[^"]*"' | cut -d: -f2 | tr -d '"')"
else
    test_failed "Health check failed"
    echo "Response: $HEALTH"
fi
echo

# Test 2: Questions API - All Questions
test_info "2. Testing questions API (all questions)..."
ALL_QUESTIONS=$(curl -s "$API_BASE/api/note/questions?limit=1000")
QUESTION_COUNT=$(echo "$ALL_QUESTIONS" | grep -o '"id":' | wc -l)
if [ "$QUESTION_COUNT" -eq 80 ]; then
    test_passed "All 80 questions accessible"
else
    test_failed "Expected 80 questions, found $QUESTION_COUNT"
fi
echo

# Test 3: Questions API - Subject Filtering
test_info "3. Testing subject filtering..."
declare -A SUBJECTS=(
    ["math"]=15
    ["english-vocabulary"]=15
    ["english-grammar"]=10
    ["english-listening"]=10
    ["physics"]=15
    ["chemistry"]=15
)

for subject in "${!SUBJECTS[@]}"; do
    EXPECTED=${SUBJECTS[$subject]}
    ACTUAL=$(curl -s "$API_BASE/api/note/questions?subject=$subject&limit=100" | grep -o '"id":' | wc -l)
    if [ "$ACTUAL" -eq "$EXPECTED" ]; then
        test_passed "$subject: $ACTUAL/$EXPECTED questions"
    else
        test_failed "$subject: $ACTUAL/$EXPECTED questions"
    fi
done
echo

# Test 4: Learning Notebook User Registration
test_info "4. Testing Learning Notebook user registration..."
LN_USER="ln-user-$TIMESTAMP"
LN_REGISTER=$(curl -s -X POST "$API_BASE/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
        \"userId\": \"$LN_USER\",
        \"displayName\": \"LN Test User $TIMESTAMP\",
        \"inquiryNumber\": \"123456\"
    }")

if echo "$LN_REGISTER" | grep -q '"success":true'; then
    test_passed "LN user registration successful"
    LN_USER_ID=$(echo "$LN_REGISTER" | grep -o '"userId":[0-9]*' | cut -d: -f2)
    test_info "LN User ID: $LN_USER_ID"
else
    test_failed "LN user registration failed"
    echo "Response: $LN_REGISTER"
fi
echo

# Test 5: Traditional User Registration (Backward Compatibility)
test_info "5. Testing traditional user registration (backward compatibility)..."
TRAD_USER="trad-user-$TIMESTAMP"
TRAD_REGISTER=$(curl -s -X POST "$API_BASE/api/auth/register-legacy" \
    -H "Content-Type: application/json" \
    -d "{
        \"username\": \"$TRAD_USER\",
        \"email\": \"test$TIMESTAMP@example.com\",
        \"password\": \"testpass123\",
        \"displayName\": \"Traditional Test\"
    }")

if echo "$TRAD_REGISTER" | grep -q '"success":true'; then
    test_passed "Traditional user registration successful"
    TRAD_USER_ID=$(echo "$TRAD_REGISTER" | grep -o '"userId":[0-9]*' | cut -d: -f2)
    test_info "Traditional User ID: $TRAD_USER_ID"
else
    test_failed "Traditional user registration failed"
    echo "Response: $TRAD_REGISTER"
fi
echo

# Test 6: Traditional Login
test_info "6. Testing traditional login..."
LOGIN_RESULT=$(curl -s -X POST "$API_BASE/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"username\": \"$TRAD_USER\",
        \"password\": \"testpass123\"
    }")

if echo "$LOGIN_RESULT" | grep -q '"success":true'; then
    test_passed "Traditional login successful"
    TOKEN=$(echo "$LOGIN_RESULT" | grep -o '"token":"[^"]*"' | cut -d: -f2 | tr -d '"')
    test_info "Session token obtained: ${TOKEN:0:20}..."
else
    test_failed "Traditional login failed"
    echo "Response: $LOGIN_RESULT"
fi
echo

# Test 7: User Profile Access
test_info "7. Testing user profile access..."
if [ ! -z "$TOKEN" ]; then
    PROFILE_RESULT=$(curl -s "$API_BASE/api/user/profile" \
        -H "Authorization: Bearer $TOKEN")

    if echo "$PROFILE_RESULT" | grep -q '"username":"'$TRAD_USER'"'; then
        test_passed "User profile access successful"
    else
        test_failed "User profile access failed"
        echo "Response: $PROFILE_RESULT"
    fi
else
    test_failed "Cannot test profile access - no token"
fi
echo

# Test 8: Progress Tracking (if user is logged in)
test_info "8. Testing progress tracking..."
if [ ! -z "$TOKEN" ]; then
    # Save progress
    SAVE_PROGRESS=$(curl -s -X POST "$API_BASE/api/note/progress" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d "{
            \"subject\": \"math\",
            \"score\": 8,
            \"totalQuestions\": 10,
            \"duration\": 15
        }")

    if echo "$SAVE_PROGRESS" | grep -q '"success":true'; then
        test_passed "Progress save successful"

        # Get progress
        GET_PROGRESS=$(curl -s "$API_BASE/api/note/progress" \
            -H "Authorization: Bearer $TOKEN")

        if echo "$GET_PROGRESS" | grep -q '"success":true'; then
            test_passed "Progress retrieval successful"
        else
            test_failed "Progress retrieval failed"
        fi
    else
        test_failed "Progress save failed"
        echo "Response: $SAVE_PROGRESS"
    fi
else
    test_failed "Cannot test progress tracking - no token"
fi
echo

# Test 9: WebAuthn/Passkey Registration (LN User)
test_info "9. Testing WebAuthn registration flow..."
if [ ! -z "$LN_USER_ID" ]; then
    # Begin passkey registration
    BEGIN_PASSKEY=$(curl -s -X POST "$API_BASE/api/auth/passkey/register/begin" \
        -H "Content-Type: application/json" \
        -d "{
            \"userId\": \"$LN_USER_ID\"
        }")

    if echo "$BEGIN_PASSKEY" | grep -q '"challenge"'; then
        test_passed "Passkey registration start successful"
        CHALLENGE=$(echo "$BEGIN_PASSKEY" | grep -o '"challenge":"[^"]*"' | cut -d: -f2 | tr -d '"')
        test_info "Challenge obtained: ${CHALLENGE:0:20}..."
    else
        test_failed "Passkey registration start failed"
        echo "Response: $BEGIN_PASSKEY"
    fi
else
    test_failed "Cannot test WebAuthn - no LN user ID"
fi
echo

# Test 10: Audio Upload
test_info "10. Testing audio upload..."
# Create a small test file
echo "test audio content" > /tmp/test-audio-$TIMESTAMP.txt

UPLOAD_RESULT=$(curl -s -X POST "$API_BASE/api/upload" \
    -F "file=@/tmp/test-audio-$TIMESTAMP.txt" \
    -F "subject=math")

if echo "$UPLOAD_RESULT" | grep -q '"success":true'; then
    test_passed "Audio upload successful"
else
    test_failed "Audio upload failed"
    echo "Response: $UPLOAD_RESULT"
fi

# Cleanup
rm -f /tmp/test-audio-$TIMESTAMP.txt
echo

# Test Summary
test_info "Test Summary:"
echo "Complete system test finished at $(date)"
echo "All major functionality tested:"
echo "  ✅ Health check"
echo "  ✅ Questions API (80 questions)"
echo "  ✅ Subject filtering"
echo "  ✅ Learning Notebook registration"
echo "  ✅ Traditional registration (backward compatibility)"
echo "  ✅ Traditional login"
echo "  ✅ User profile access"
echo "  ✅ Progress tracking"
echo "  ✅ WebAuthn flow initiation"
echo "  ✅ Audio upload"
echo
echo "If all tests passed, the system is ready for production deployment!"