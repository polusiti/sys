#!/bin/bash

# Learning Notebook API Test Script

API_BASE="https://data-manager-auth.t88596565.workers.dev"

echo "=== Testing Learning Notebook API ==="
echo

# Test 1: Get questions from D1
echo "1. Testing questions API..."
echo "Request: GET /api/note/questions?subject=math&limit=3"
RESPONSE=$(curl -s "$API_BASE/api/note/questions?subject=math&limit=3")
echo "Response: $RESPONSE"
echo

# Test 2: Get questions by subject
echo "2. Testing questions by subject..."
for subject in "english-vocabulary" "physics" "chemistry"; do
    echo "Subject: $subject"
    COUNT=$(curl -s "$API_BASE/api/note/questions?subject=$subject&limit=1" | grep -o '"total":[0-9]*' | cut -d: -f2)
    echo "Questions available: $COUNT"
done
echo

# Test 3: Test user registration (simulation)
echo "3. Testing user registration endpoint..."
echo "Request: POST /api/auth/register"
REGISTER_TEST=$(curl -s -X POST "$API_BASE/api/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "userId": "testuser2025",
        "displayName": "Test User 2025",
        "inquiryNumber": "123456"
    }')
echo "Response: $REGISTER_TEST"
echo

# Test 4: Test health endpoint
echo "4. Testing health endpoint..."
HEALTH=$(curl -s "$API_BASE/api/health")
echo "Health Status: $HEALTH"
echo

echo "=== API Test Complete ==="