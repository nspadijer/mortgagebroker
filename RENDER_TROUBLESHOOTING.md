# Render Deployment Troubleshooting

## Quick Status Check

Visit your Render dashboard: https://dashboard.render.com/web/srv-XXX/logs

### What to Look For in Logs

**✅ Successful Deployment:**
```
==> Running 'node dist/mcp-server/server.js'
✓ Knowledge base initialized with FRED API integration (prioritized)
MortgageBroker MCP listening on http://0.0.0.0:10000/mcp
==> Your service is live 🎉
```

**❌ Port Binding Issue (FIXED in latest commit):**
```
MortgageBroker MCP listening on http://127.0.0.1:0/mcp
==> No open ports detected on 0.0.0.0
==> Port scan timeout reached
```

## Current Deployment URL

**Service URL**: https://mortgagebroker.onrender.com
**MCP Endpoint**: https://mortgagebroker.onrender.com/mcp
**Health Check**: https://mortgagebroker.onrender.com/

## Deployment Checklist

### 1. Verify Latest Code is Deployed

In Render Dashboard:
- [ ] Check "Events" tab - should show latest commit `dcf02e0`
- [ ] If not, click "Manual Deploy" → "Deploy latest commit"
- [ ] Wait for build to complete (usually 2-3 minutes)

### 2. Required Environment Variables

Go to "Environment" tab and verify these are set:

**Critical (Service won't work without these):**
- [ ] `NODE_ENV=production` (should be auto-set from render.yaml)
- [ ] `DATABASE_URL` - Your PostgreSQL connection string
- [ ] `FRED_API_KEY` - Your FRED API key

**Email (Required for lead notifications):**
- [ ] `LEAD_EMAIL_TO` - Recipient email address
- [ ] `SMTP_HOST` - Your SMTP server
- [ ] `SMTP_PORT` - Usually 587
- [ ] `SMTP_USER` - SMTP username
- [ ] `SMTP_PASS` - SMTP password

**Auto-configured (Don't set these manually):**
- [ ] `PORT` - Render provides this automatically (usually 10000)
- [ ] `HOST` - Auto-detected based on NODE_ENV

### 3. Check Build Logs

Look for:
```bash
==> Running build command 'npm install; npm run build:full; npm run mcp:compile'
✔ Generated Prisma Client (v5.22.0)
✓ built in X.XXs
==> Build successful 🎉
```

**Common Build Issues:**

**Issue**: Prisma generation fails
**Solution**: Already fixed in latest commit - redeploy

**Issue**: TypeScript compilation errors
**Solution**: Check logs for specific errors, may need to fix types

### 4. Check Runtime Logs

**Good Output:**
```
✓ Knowledge base initialized with FRED API integration (prioritized)
MortgageBroker MCP listening on http://0.0.0.0:10000/mcp
```

**Bad Output (Old Code):**
```
MortgageBroker MCP listening on http://127.0.0.1:0/mcp
```
**Fix**: Redeploy with latest commit

### 5. Database Connection

If you see database errors:

**Error**: `Can't reach database server`
**Solutions**:
1. Verify DATABASE_URL is correct
2. Check if PostgreSQL instance is running
3. Ensure it's using Internal Database URL (not External)
4. Run migrations: Add to build command:
   ```
   npm install && npx prisma generate --schema=infra/prisma/schema.prisma && npx prisma migrate deploy --schema=infra/prisma/schema.prisma && npm run build && npm run mcp:compile
   ```

### 6. FRED API Issues

If you see `FRED API` errors:

**Error**: `401 Unauthorized` or `API key invalid`
**Solution**:
1. Verify FRED_API_KEY is set correctly
2. Test your key: https://api.stlouisfed.org/fred/series/observations?series_id=MORTGAGE30US&api_key=YOUR_KEY&file_type=json
3. Get a new key if needed: https://fred.stlouisfed.org/docs/api/api_key.html

### 7. Free Tier Spin Down

**Issue**: Service appears offline after 15 minutes of inactivity
**Solution**: This is normal for free tier
- First request after spin down takes 30-60 seconds
- Service wakes up automatically
- Consider upgrading to paid tier for always-on

## Testing Your Deployment

### 1. Health Check
```bash
curl https://mortgagebroker.onrender.com/
# Expected: MortgageBroker MCP server
```

### 2. MCP Endpoint
```bash
curl -X POST https://mortgagebroker.onrender.com/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json,text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### 3. Test with Real Query
```bash
curl -X POST https://mortgagebroker.onrender.com/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json,text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"mortgageAdvisor","arguments":{"question":"What are current mortgage rates?"}}}'
```

## Connect to ChatGPT

Once service is running:

1. **Get your MCP URL**: `https://mortgagebroker.onrender.com/mcp`

2. **In ChatGPT**:
   - Go to Settings
   - Navigate to ChatGPT → Custom GPTs or MCP
   - Click "Add new MCP server"
   - Enter URL: `https://mortgagebroker.onrender.com/mcp`
   - Save

3. **Test in ChatGPT**:
   - Ask: "What are current mortgage rates?"
   - Should return real-time FRED data

## Common Fixes

### Service Shows "Deploying" for Long Time
1. Check build logs for errors
2. Cancel and retry deployment
3. Check for syntax errors in code

### Service Keeps Crashing
1. Check runtime logs for error messages
2. Verify all required environment variables
3. Test database connection
4. Check FRED API key validity

### "No Open Ports Detected"
**This should be FIXED in commit dcf02e0**
1. Verify you deployed latest commit
2. Check logs show: `http://0.0.0.0:10000/mcp` (not 127.0.0.1)
3. Verify NODE_ENV=production is set

### Timeout/Connection Refused
1. Service might be spinning down (free tier)
2. Wait 30-60 seconds and retry
3. Check service status in dashboard
4. Verify service is "Live" not "Failed"

## Manual Deployment Steps

If automatic deployment isn't working:

1. **In Render Dashboard**:
   - Go to your service
   - Click "Manual Deploy"
   - Select "Deploy latest commit"

2. **Build Command** (should be from render.yaml):
   ```bash
   npm install && npx prisma generate --schema=infra/prisma/schema.prisma && npm run build && npm run mcp:compile
   ```

3. **Start Command**:
   ```bash
   node dist/mcp-server/server.js
   ```

4. **Environment**:
   - NODE_ENV: production
   - Add your database and API credentials

## Support Resources

- **Render Status**: https://status.render.com/
- **Render Docs**: https://render.com/docs/web-services
- **FRED API Docs**: https://fred.stlouisfed.org/docs/api/
- **Repository**: https://github.com/nspadijer/mortgagebroker

## Emergency Rollback

If latest deployment is broken:

1. Go to "Events" tab in Render
2. Find a working previous deployment
3. Click "Rollback to this deploy"

## Next Steps After Service is Live

Once you see "Your service is live 🎉":

1. Test health check endpoint
2. Test MCP endpoint with curl
3. Connect to ChatGPT
4. Test real queries
5. Monitor logs for any errors
6. Set up monitoring/alerts (optional)
