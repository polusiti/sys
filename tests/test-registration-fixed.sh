#!/bin/bash

# Test the fixed registration API with users_v2 table
echo "Testing registration API with users_v2 table..."

# Test 1: Register a new user without email (should work now)
echo "Test 1: Registering user without email"
response1=$(curl -s -X POST https://api.allfrom0.top/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer questa-admin-2024" \
  -d '{
    "userId": "testuser-noemail",
    "displayName": "Test User No Email"
  }')

echo "Response 1: $response1"
echo ""

# Test 2: Register a new user with email (should work)
echo "Test 2: Registering user with email"
response2=$(curl -s -X POST https://api.allfrom0.top/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer questa-admin-2024" \
  -d '{
    "userId": "testuser-email",
    "displayName": "Test User With Email",
    "email": "test@example.com"
  }')

echo "Response 2: $response2"
echo ""

# Test 3: Check API health
echo "Test 3: API Health check"
response3=$(curl -s https://api.allfrom0.top/api/health)
echo "Response 3: $response3"
echo ""

# Test 4: Try to register duplicate user (should fail)
echo "Test 4: Registering duplicate user (should fail)"
response4=$(curl -s -X POST https://api.allfrom0.top/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer questa-admin-2024" \
  -d '{
    "userId": "testuser-noemail",
    "displayName": "Duplicate User"
  }')

echo "Response 4: $response4"
echo ""

echo "Testing completed!"