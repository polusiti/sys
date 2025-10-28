#!/bin/bash

# Test script for the newly deployed system
API_BASE="https://questa-r2-api.t88596565.workers.dev"

echo "=== Testing Deployed Learning Notebook System ==="
echo "API Base: $API_BASE"
echo

# Helper functions
test_passed() {
    echo -e "✅ $1"
}

test_failed() {
    echo -e "❌ $1"
}

TIMESTAMP=$(date +%s)
echo "Test timestamp: $TIMESTAMP"
echo

# Test 1: Health Check
echo "1. Testing health endpoint..."
HEALTH=$(curl -s "$API_BASE/api/health")
if echo "$HEALTH" | grep -q '"status":"ok"'; then
    test_passed "Health check passed"
    echo "   Service: $(echo "$HEALTH" | grep -o '"service":"[^"]*"' | cut -d: -f2 | tr -d '"')"
else
    test_failed "Health check failed"
    echo "   Response: $HEALTH"
fi
echo

# Test 2: Questions API
echo "2. Testing questions API..."
QUESTIONS=$(curl -s "$API_BASE/api/note/questions?limit=5")
QUESTION_COUNT=$(echo "$QUESTIONS" | grep -o '"id":' | wc -l)
if [ "$QUESTION_COUNT" -gt 0 ]; then
    test_passed "Questions API working ($QUESTION_COUNT questions retrieved)"
else
    test_failed "Questions API failed"
fi
echo

# Test 3: Learning Notebook User Registration
echo "3. Testing Learning Notebook user registration..."
LN_USER="test-ln-$TIMESTAMP"
LN_REGISTER=$(curl -s -X POST "$API_BASE/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
        \"userId\": \"$LN_USER\",
        \"displayName\": \"LN Test User\",
        \"inquiryNumber\": \"123456\"
    }")

if echo "$LN_REGISTER" | grep -q '"success":true'; then
    test_passed "LN user registration successful"
    LN_USER_ID=$(echo "$LN_REGISTER" | grep -o '"userId":[0-9]*' | cut -d: -f2)
    echo "   User ID: $LN_USER_ID"
else
    test_failed "LN user registration failed"
    echo "   Response: $LN_REGISTER"
fi
echo

# Test 4: Traditional Login
echo "4. Testing traditional login..."
TRAD_USER="test-trad-$TIMESTAMP"
# First register a traditional user
TRAD_REG=$(curl -s -X POST "$API_BASE/api/auth/register-legacy" \
    -H "Content-Type: application/json" \
    -d "{
        \"username\": \"$TRAD_USER\",
        \"email\": \"test$TIMESTAMP@example.com\",
        \"password\": \"testpass123\",
        \"displayName\": \"Traditional Test\"
    }")

if echo "$TRAD_REG" | grep -q '"success":true'; then
    test_passed "Traditional user registration successful"

    # Now login
    LOGIN_RESULT=$(curl -s -X POST "$API_BASE/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{
            \"username\": \"$TRAD_USER\",
            \"password\": \"testpass123\"
        }")

    if echo "$LOGIN_RESULT" | grep -q '"success":true'; then
        test_passed "Traditional login successful"
        TOKEN=$(echo "$LOGIN_RESULT" | grep -o '"token":"[^"]*"' | cut -d: -f2 | tr -d '"')
        echo "   Token obtained: ${TOKEN:0:20}..."
    else
        test_failed "Traditional login failed"
        echo "   Response: $LOGIN_RESULT"
    fi
else
    test_failed "Traditional user registration failed"
    echo "   Response: $TRAD_REG"
fi
echo

# Test 5: WebAuthn Registration Start
echo "5. Testing WebAuthn registration start..."
if [ ! -z "$LN_USER_ID" ]; then
    BEGIN_PASSKEY=$(curl -s -X POST "$API_BASE/api/auth/passkey/register/begin" \
        -H "Content-Type: application/json" \
        -d "{
            \"userId\": \"$LN_USER_ID\"
        }")

    if echo "$BEGIN_PASSKEY" | grep -q '"challenge"'; then
        test_passed "WebAuthn registration start successful"
        CHALLENGE=$(echo "$BEGIN_PASSKEY" | grep -o '"challenge":"[^"]*"' | cut -d: -f2 | tr -d '"')
        echo "   Challenge: ${CHALLENGE:0:20}..."
    else
        test_failed "WebAuthn registration start failed"
        echo "   Response: $BEGIN_PASSKEY"
    fi
else
    test_failed "Cannot test WebAuthn - no LN user ID"
fi
echo

# Test 6: Progress Tracking (if we have a token)
echo "6. Testing progress tracking..."
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
        echo "   Response: $SAVE_PROGRESS"
    fi
else
    test_failed "Cannot test progress - no token"
fi
echo

echo "=== Test Summary ==="
echo "Deployment test completed at $(date)"
echo "If most tests passed, the deployment is successful!"