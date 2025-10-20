# Learning Notebook Complete Deployment Guide

## 🎯 Overview

This guide provides step-by-step instructions for deploying the complete Learning Notebook system with full D1 integration and WebAuthn authentication.

## 📋 Prerequisites

1. **Cloudflare Account** with Workers, D1, and R2 enabled
2. **Wrangler CLI** installed and authenticated
3. **Access to the existing D1 database** and R2 bucket
4. **Domain name** configured (optional but recommended)

## 🗂️ File Structure

```
learning-notebook/
├── cloudflare-worker-learning-notebook-complete.js  # Main worker file
├── migration-complete-schema-fix.sql               # Database migration
├── test-complete-system.sh                         # System test script
├── DEPLOYMENT-GUIDE.md                            # This guide
└── js/login.js                                    # Frontend authentication
```

## 🚀 Step-by-Step Deployment

### Step 1: Database Migration

**Execute the migration script:**

```bash
# Navigate to your project directory
cd /home/higuc/sys/learning-notebook

# Execute the migration (using wrangler)
wrangler d1 execute TESTAPP_DB --file=migration-complete-schema-fix.sql
```

**Expected output:**
```
✅ All tables created/updated successfully
✅ Indexes created
✅ Views created
✅ Data cleaned up
```

### Step 2: Deploy the Updated Worker

**Deploy the new integrated worker:**

```bash
# Navigate to the sys directory (where wrangler.toml is located)
cd /home/higuc/sys

# Deploy the new worker
wrangler deploy cloudflare-worker-learning-notebook-complete.js --name learning-notebook-api
```

**Verify deployment:**

```bash
# Test the health endpoint
curl https://learning-notebook-api.your-subdomain.workers.dev/api/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "learning-notebook-complete-api",
  "database": "connected",
  "timestamp": "2025-10-17T..."
}
```

### Step 3: Update Environment Variables

**Set required environment variables:**

```bash
# Set JWT secret
wrangler secret put JWT_SECRET

# Set R2 bucket name
wrangler secret put R2_BUCKET_NAME

# Set RP_ID for WebAuthn (your domain)
wrangler secret put RP_ID
```

**Values to set:**
- `JWT_SECRET`: Generate a strong random string (e.g., `openssl rand -base64 32`)
- `R2_BUCKET_NAME`: `QUESTA_BUCKET` (existing bucket)
- `RP_ID`: `your-domain.com` or `localhost` for testing

### Step 4: Update Frontend Configuration

**Update the API base URL in frontend:**

```javascript
// In js/login.js
const API_BASE_URL = 'https://learning-notebook-api.your-subdomain.workers.dev';
```

### Step 5: Test the Complete System

**Run the comprehensive test:**

```bash
cd /home/higuc/sys/learning-notebook
./test-complete-system.sh
```

**Expected results:**
- ✅ All 80 questions accessible
- ✅ Subject filtering working
- ✅ Learning Notebook registration working
- ✅ WebAuthn passkey registration working
- ✅ Progress tracking functional
- ✅ Audio uploads working

## 🔧 Configuration Details

### Database Schema

The migration creates/updates the following tables:

1. **users** - Extended with LN-specific columns
2. **webauthn_challenges** - WebAuthn challenge storage
3. **webauthn_credentials** - Passkey credentials
4. **user_progress** - Learning progress tracking
5. **study_sessions** - Individual study sessions
6. **user_sessions** - JWT session management

### API Endpoints

**Authentication:**
- `POST /api/auth/register` - Learning Notebook registration
- `POST /api/auth/register-legacy` - Traditional registration
- `POST /api/auth/login` - Traditional login
- `POST /api/auth/passkey/register/begin` - Start passkey registration
- `POST /api/auth/passkey/register/complete` - Complete passkey registration
- `POST /api/auth/passkey/login/begin` - Start passkey login
- `POST /api/auth/passkey/login/complete` - Complete passkey login
- `GET /api/auth/me` - Get user info

**Learning Content:**
- `GET /api/note/questions` - Get questions with filtering
- `POST /api/note/questions` - Create question
- `PUT /api/note/questions/{id}` - Update question
- `DELETE /api/note/questions/{id}` - Delete question

**Progress Tracking:**
- `GET /api/note/progress` - Get user progress
- `POST /api/note/progress` - Save progress

**Utilities:**
- `GET /api/health` - Health check
- `POST /api/upload` - Simple file upload

## 🧪 Testing

### Manual Testing

1. **User Registration:**
   - Visit the login page
   - Click "新規登録"
   - Fill in userId, displayName, inquiryNumber
   - Create a passkey when prompted

2. **Learning Flow:**
   - Login with passkey
   - Select a subject
   - Answer questions
   - Check progress tracking

3. **Guest Mode:**
   - Click "ゲストとして利用"
   - Verify questions are accessible

### Automated Testing

```bash
# Run all tests
./test-complete-system.sh

# Test specific functionality
curl -X POST "https://your-api.workers.dev/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","displayName":"Test User","inquiryNumber":"123456"}'
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Errors:**
   ```bash
   # Check D1 binding
   wrangler d1 info TESTAPP_DB
   ```

2. **WebAuthn Errors:**
   - Ensure `RP_ID` matches your domain
   - Check HTTPS is enabled (required for WebAuthn)
   - Verify browser supports WebAuthn

3. **Progress Tracking Issues:**
   - Check user_sessions table for valid tokens
   - Verify user_progress table exists
   - Check JWT_SECRET is set

4. **Audio Upload Failures:**
   - Verify R2 bucket permissions
   - Check bucket name in environment variables
   - Ensure file size limits are respected

### Debug Commands

```bash
# Check worker logs
wrangler tail learning-notebook-api

# Test database connection
wrangler d1 execute TESTAPP_DB --command="SELECT COUNT(*) FROM users"

# Check environment variables
wrangler secret list
```

## 📊 Monitoring

### Key Metrics

1. **User Registration Rate**
2. **Active Sessions**
3. **Question Access Patterns**
4. **Progress Tracking Usage**
5. **WebAuthn Success Rate**

### Health Monitoring

```bash
# Health check endpoint
curl https://your-api.workers.dev/api/health

# Check database status
curl https://your-api.workers.dev/api/note/questions?limit=1
```

## 🔒 Security Considerations

1. **JWT Tokens:** Use strong secrets and reasonable expiration
2. **WebAuthn:** Requires HTTPS and proper domain configuration
3. **Input Validation:** All inputs are validated server-side
4. **CORS:** Configured for your specific domains
5. **Rate Limiting:** Consider implementing for production

## 🚀 Production Checklist

- [ ] Database migration completed successfully
- [ ] Worker deployed without errors
- [ ] All environment variables set
- [ ] SSL certificate configured
- [ ] Custom domain pointing to worker
- [ ] CORS configured for production domains
- [ ] Monitoring and alerting set up
- [ ] Backup procedures documented
- [ ] Load testing performed
- [ ] Security review completed

## 📞 Support

If you encounter issues:

1. Check the worker logs: `wrangler tail`
2. Verify database connectivity: `wrangler d1 info`
3. Test with the provided script: `./test-complete-system.sh`
4. Review this guide for common solutions

---

**Deployment Status:** Ready for production deployment
**Last Updated:** 2025-10-17
**Version:** 1.0.0