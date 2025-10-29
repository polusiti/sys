#!/bin/bash

# APIリクエストデバッグスクリプト
# ブラウザからのリクエストをcurlで再現する

API_BASE_URL="https://testapp-d1-api.t88596565.workers.dev"
LANGUAGE_TOOL_URL="https://languagetool-api.t88596565.workers.dev/api/v2/grammar"

echo "=== API Debug Script ==="
echo "Testing with curl to reproduce browser requests..."
echo

# 1. テスト用データ生成
TIMESTAMP=$(date +%s)
USER_ID="testuser_debug_$TIMESTAMP"
DISPLAY_NAME="Debug Test User"
INQUIRY_NUMBER="123456"
ADMIN_TOKEN="questa-admin-2024"

echo "1. Testing User Registration API..."
echo "User ID: $USER_ID"
echo

# 2. ユーザー登録APIテスト
curl -v -w "\n=== CURL INFO ===\nHTTP Status: %{http_code}\nTime Total: %{time_total}s\nTime Connect: %{time_connect}s\nTime Start Transfer: %{time_starttransfer}s\n" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Accept: application/json" \
  -H "Cache-Control: no-cache" \
  -H "Pragma: no-cache" \
  -H "Origin: https://allfrom0.top" \
  -H "Referer: https://allfrom0.top/" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" \
  -d "{\"userId\":\"$USER_ID\",\"displayName\":\"$DISPLAY_NAME\",\"inquiryNumber\":\"$INQUIRY_NUMBER\"}" \
  "$API_BASE_URL/api/auth/register"

echo
echo "========================"
echo

# 3. LanguageTool APIテスト
echo "2. Testing LanguageTool API..."
echo

curl -v -w "\n=== CURL INFO ===\nHTTP Status: %{http_code}\nTime Total: %{time_total}s\nTime Connect: %{time_connect}s\nTime Start Transfer: %{time_starttransfer}s\n" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Origin: https://allfrom0.top" \
  -H "Referer: https://allfrom0.top/" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" \
  -d '{"text":"This is a test sentence for grammar checking.","language":"en-US"}' \
  "$LANGUAGE_TOOL_URL"

echo
echo "========================"
echo "Debug script completed."