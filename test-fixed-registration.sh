#!/bin/bash

# Test script for fixed registration API
# This script tests the unified-api-worker.js fix for users.email NOT NULL constraint

API_BASE="https://api.allfrom0.top"
ADMIN_TOKEN="questa-admin-2024"

echo "🧪 Testing Fixed Registration API"
echo "================================"
echo "API Base: $API_BASE"
echo "Timestamp: $(date)"
echo ""

# Test 1: Health Check
echo "1. 📊 Health Check"
curl -s "$API_BASE/api/health" | jq '.'
echo ""

# Test 2: Registration with generated email
echo "2. 👤 User Registration (with auto-generated email)"
USER_ID="test_user_$(date +%s)"
DISPLAY_NAME="Test User $(date +%s)"
SECRET_ANSWER="Naruto"

REGISTER_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"displayName\": \"$DISPLAY_NAME\",
    \"secretAnswer\": \"$SECRET_ANSWER\"
  }" \
  "$API_BASE/api/auth/register")

echo "Request:"
echo "- userId: $USER_ID"
echo "- displayName: $DISPLAY_NAME"
echo "- secretAnswer: $SECRET_ANSWER"
echo "- email: [auto-generated]"
echo ""
echo "Response:"
echo "$REGISTER_RESPONSE" | jq '.'

# Check if registration was successful
SUCCESS=$(echo "$REGISTER_RESPONSE" | jq -r '.success // false')
if [ "$SUCCESS" = "true" ]; then
    echo "✅ Registration successful!"
else
    echo "❌ Registration failed!"
    ERROR_DETAILS=$(echo "$REGISTER_RESPONSE" | jq -r '.details // "Unknown error"')
    echo "Error details: $ERROR_DETAILS"
fi

echo ""

# Test 3: Registration with explicit email
echo "3. 📧 User Registration (with explicit email)"
USER_ID_2="test_user_email_$(date +%s)"
DISPLAY_NAME_2="Test Email User $(date +%s)"
EXPLICIT_EMAIL="test${USER_ID_2}@example.com"

REGISTER_RESPONSE_2=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{
    \"userId\": \"$USER_ID_2\",
    \"displayName\": \"$DISPLAY_NAME_2\",
    \"email\": \"$EXPLICIT_EMAIL\"
  }" \
  "$API_BASE/api/auth/register")

echo "Request:"
echo "- userId: $USER_ID_2"
echo "- displayName: $DISPLAY_NAME_2"
echo "- email: $EXPLICIT_EMAIL"
echo ""
echo "Response:"
echo "$REGISTER_RESPONSE_2" | jq '.'

SUCCESS_2=$(echo "$REGISTER_RESPONSE_2" | jq -r '.success // false')
if [ "$SUCCESS_2" = "true" ]; then
    echo "✅ Registration with explicit email successful!"
else
    echo "❌ Registration with explicit email failed!"
    ERROR_DETAILS_2=$(echo "$REGISTER_RESPONSE_2" | jq -r '.details // "Unknown error"')
    echo "Error details: $ERROR_DETAILS_2"
fi

echo ""

# Test 4: Duplicate user registration (should fail with 409)
echo "4. 🚫 Duplicate Registration Test (should fail)"
REGISTER_RESPONSE_3=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"displayName\": \"$DISPLAY_NAME\"
  }" \
  "$API_BASE/api/auth/register")

echo "Request: Same as Test 1"
echo ""
echo "Response:"
echo "$REGISTER_RESPONSE_3" | jq '.'

HTTP_STATUS_3=$(echo "$REGISTER_RESPONSE_3" | jq -r '.error // empty')
if [ -n "$HTTP_STATUS_3" ]; then
    echo "✅ Duplicate registration correctly rejected!"
else
    echo "❌ Duplicate registration not properly handled!"
fi

echo ""

# Test 5: Missing required fields (should fail with 400)
echo "5. ⚠️ Missing Fields Test (should fail)"
REGISTER_RESPONSE_4=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{
    \"userId\": \"\"
  }" \
  "$API_BASE/api/auth/register")

echo "Request: Missing displayName"
echo ""
echo "Response:"
echo "$REGISTER_RESPONSE_4" | jq '.'

echo ""

# Test 6: Invalid admin token (should fail with 401)
echo "6. 🔐 Invalid Token Test (should fail)"
REGISTER_RESPONSE_5=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token" \
  -d "{
    \"userId\": \"invalid_test\",
    \"displayName\": \"Invalid Test\"
  }" \
  "$API_BASE/api/auth/register")

echo "Request: Invalid admin token"
echo ""
echo "Response:"
echo "$REGISTER_RESPONSE_5" | jq '.'

echo ""
echo "================================"
echo "🏁 Test Summary"
echo "================================"

# Count successful tests
TOTAL_TESTS=6
SUCCESS_COUNT=0

if [ "$SUCCESS" = "true" ]; then ((SUCCESS_COUNT++)); fi
if [ "$SUCCESS_2" = "true" ]; then ((SUCCESS_COUNT++)); fi
if [ -n "$HTTP_STATUS_3" ]; then ((SUCCESS_COUNT++)); fi
if echo "$REGISTER_RESPONSE_4" | jq -e '.error' > /dev/null 2>&1; then ((SUCCESS_COUNT++)); fi
if echo "$REGISTER_RESPONSE_5" | jq -e '.error' > /dev/null 2>&1; then ((SUCCESS_COUNT++)); fi

# Health check also counts as success
if curl -s "$API_BASE/api/health" | jq -e '.status' > /dev/null 2>&1; then ((SUCCESS_COUNT++)); fi

echo "Successful tests: $SUCCESS_COUNT/$TOTAL_TESTS"

if [ $SUCCESS_COUNT -eq $TOTAL_TESTS ]; then
    echo "🎉 All tests passed! The registration API is working correctly."
else
    echo "⚠️  Some tests failed. Please check the responses above."
fi

echo ""
echo "📋 Next Steps:"
echo "1. Deploy unified-api-worker.js to Cloudflare Workers"
echo "2. Run the database migration script"
echo "3. Test the frontend registration flow"
echo "4. Monitor for any remaining issues"