# Render Environment Variables - CORRECT Configuration

## ❌ Current Problem

Your Render deployment is failing because:
1. `NODE_ENV=development` → Server binds to 127.0.0.1 (localhost only)
2. `DATABASE_URL=postgresql://user:password@localhost:5432/mortgagebroker` → Wrong database URL

## ✅ Required Environment Variables

Copy these EXACT values into your Render Environment settings:

```bash
# CRITICAL - Change this first!
NODE_ENV=production

# Database (Option A: Use Render PostgreSQL)
DATABASE_URL=<YOUR_RENDER_POSTGRES_INTERNAL_URL>
# To get this: Dashboard → PostgreSQL instance → Connection → Internal Database URL
# Example format: postgresql://user:pass@dpg-xxx.oregon-postgres.render.com/dbname

# OR Database (Option B: No database - uses in-memory)
# Simply delete the DATABASE_URL variable entirely

# FRED API (Keep this)
FRED_API_KEY=2f9c89020536e51638ff014cfac64b4e

# Email Configuration (Keep these)
LEAD_EMAIL_TO=nikola.cfn@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=nikola.cfn@gmail.com
SMTP_PASS=mwkrapxedjvdbbgf
```

## ❌ Remove These Variables

These are NOT needed in production and cause confusion:

```bash
# Delete these:
NGROK_API_KEY          # Only for local development tunneling
NGROK_AUTHTOKEN        # Only for local development tunneling
APP_URL                # Not used by the server
NAF_PORTAL_URL         # Hardcoded in server.ts
AUDIT_LOG_ENABLED      # Feature not implemented
AUDIT_LOG_FILE         # Feature not implemented
RATE_LIMIT_ENABLED     # Feature not implemented
RATE_LIMIT_MAX_REQUESTS # Feature not implemented
RATE_LIMIT_WINDOW_MS   # Feature not implemented
ENCRYPTION_KEY         # Feature not implemented
```

## 📋 Step-by-Step Fix

### Step 1: Change NODE_ENV

1. Go to Render Dashboard → Your Service → Environment
2. Find `NODE_ENV`
3. Change value from `development` to `production`
4. Click outside the field to save

### Step 2: Fix DATABASE_URL

**Option A: Use Render PostgreSQL (Recommended)**

1. Create PostgreSQL database if you don't have one:
   - Dashboard → New + → PostgreSQL
   - Name: `mortgagebroker-db`
   - Region: Same as your web service (Oregon)
   - Plan: Free

2. Get the Internal Database URL:
   - Go to your PostgreSQL instance
   - Click "Info" or "Connection"
   - Copy **Internal Database URL** (NOT External)
   - Format: `postgresql://user:pass@dpg-xxx.oregon-postgres.render.com/dbname`

3. Update DATABASE_URL:
   - Go back to your web service → Environment
   - Find `DATABASE_URL`
   - Paste the Internal Database URL
   - Save

**Option B: No Database (Simpler, but data isn't persistent)**

1. Go to Environment tab
2. Find `DATABASE_URL`
3. Click the trash icon to delete it
4. Server will use in-memory storage (resets on restart)

### Step 3: Remove Unnecessary Variables

For each of these, click the trash icon:
- NGROK_API_KEY
- NGROK_AUTHTOKEN
- APP_URL
- NAF_PORTAL_URL
- AUDIT_LOG_ENABLED
- AUDIT_LOG_FILE
- RATE_LIMIT_ENABLED
- RATE_LIMIT_MAX_REQUESTS
- RATE_LIMIT_WINDOW_MS
- ENCRYPTION_KEY (it's empty anyway)

### Step 4: Save and Redeploy

1. Click "Save Changes" (if there's a button)
2. Go to "Manual Deploy" → "Deploy latest commit"
3. Wait 2-3 minutes
4. Check logs for success

## ✅ Expected Logs After Fix

```
==> Cloning from https://github.com/nspadijer/mortgagebroker
==> Checking out commit dcf02e0
==> Running build command...
✔ Generated Prisma Client
✓ built in 1.37s
==> Build successful 🎉
==> Deploying...
==> Running 'node dist/mcp-server/server.js'
✓ Knowledge base initialized with FRED API integration (prioritized)
MortgageBroker MCP listening on http://0.0.0.0:10000/mcp
==> Your service is live 🎉
```

Key line to verify: **`http://0.0.0.0:10000/mcp`** (NOT 127.0.0.1)

## 🧪 Test After Deployment

Once you see "Your service is live":

```bash
# Test health check
curl https://mortgagebroker.onrender.com/
# Expected: MortgageBroker MCP server

# Test MCP endpoint
curl -X POST https://mortgagebroker.onrender.com/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json,text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## 📊 Final Environment Variables List

Your Render Environment should have ONLY these:

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | **CRITICAL** |
| `DATABASE_URL` | `postgresql://...` or deleted | Use Render's Internal URL |
| `FRED_API_KEY` | `2f9c89020536e51638ff014cfac64b4e` | ✅ Correct |
| `LEAD_EMAIL_TO` | `nikola.cfn@gmail.com` | ✅ Correct |
| `SMTP_HOST` | `smtp.gmail.com` | ✅ Correct |
| `SMTP_PORT` | `587` | ✅ Correct |
| `SMTP_USER` | `nikola.cfn@gmail.com` | ✅ Correct |
| `SMTP_PASS` | `mwkrapxedjvdbbgf` | ✅ Correct |

**Total: 6-7 variables** (not 16!)

## ⚠️ Important Notes

- **PORT** and **HOST** are NOT needed - Render provides PORT automatically
- The code auto-detects HOST based on NODE_ENV
- All the RATE_LIMIT_*, AUDIT_*, NGROK_* variables are not used

## 🎯 What This Fixes

**Before (NODE_ENV=development):**
```
MortgageBroker MCP listening on http://127.0.0.1:10000/mcp
→ Render can't access 127.0.0.1 → Timeout
```

**After (NODE_ENV=production):**
```
MortgageBroker MCP listening on http://0.0.0.0:10000/mcp
→ Accessible from outside container → Success! 🎉
```
