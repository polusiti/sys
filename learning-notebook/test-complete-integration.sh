#!/bin/bash

# Learning Notebook Complete Integration Test Script

API_BASE="https://data-manager-auth.t88596565.workers.dev"

echo "=== Learning Notebook Complete Integration Test ==="
echo

# Test 1: Health Check
echo "1. Testing health endpoint..."
HEALTH=$(curl -s "$API_BASE/api/health")
echo "Health Status: $HEALTH"
echo

# Test 2: Questions Availability
echo "2. Testing questions availability for all subjects..."
for subject in "math" "english-vocabulary" "physics" "chemistry" "biology" "japanese"; do
    echo "Subject: $subject"
    COUNT=$(curl -s "$API_BASE/api/note/questions?subject=$subject&limit=1" | grep -o '"total":[0-9]*' | cut -d: -f2)
    echo "Questions available: ${count:-0}"
done
echo

# Test 3: User Registration (Learning Notebook format)
echo "3. Testing Learning Notebook user registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE/api/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "userId": "testuser'$(date +%s)'",
        "displayName": "Test User '$(date +%s)'",
        "inquiryNumber": "123456"
    }')
echo "Registration Response: $REGISTER_RESPONSE"
echo

# Test 4: Traditional User Registration
echo "4. Testing traditional user registration..."
TRADITIONAL_REGISTER=$(curl -s -X POST "$API_BASE/api/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "username": "traditionaltest'$(date +%s)'",
        "email": "test'$(date +%s)'@example.com",
        "password": "testpass123",
        "displayName": "Traditional Test"
    }')
echo "Traditional Registration Response: $TRADITIONAL_REGISTER"
echo

# Test 5: Questions API Details
echo "5. Testing detailed questions API..."
MATH_QUESTIONS=$(curl -s "$API_BASE/api/note/questions?subject=math&limit=2")
echo "Math Questions Sample: $MATH_QUESTIONS"
echo

# Test 6: Get Total Questions Count
echo "6. Getting total questions count..."
TOTAL_QUESTIONS=$(curl -s "$API_BASE/api/note/questions?limit=1000" | grep -o '"total":[0-9]*' | cut -d: -f2)
echo "Total Questions Available: ${TOTAL_QUESTIONS:-0}"
echo

echo "=== Integration Test Complete ==="