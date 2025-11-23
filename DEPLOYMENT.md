# MortgageBroker MCP - Deployment Guide

This guide covers deploying the MortgageBroker MCP server to Render.com for production use with ChatGPT.

## Prerequisites

- GitHub account with repository access (nspadijer/mortgagebroker)
- Render.com account
- PostgreSQL database (can be created on Render)
- FRED API key from https://fred.stlouisfed.org/docs/api/api_key.html
- SMTP credentials for email notifications

## Quick Deploy to Render

### Option 1: Using render.yaml (Recommended)

1. **Connect Repository**
   - Go to https://render.com/dashboard
   - Click "New +" → "Blueprint"
   - Connect your GitHub account
   - Select `nspadijer/mortgagebroker` repository
   - Render will automatically detect `render.yaml`

2. **Configure Environment Variables**

   Set the following in Render dashboard:

   ```bash
   # Database (required)
   DATABASE_URL=postgresql://user:password@host:5432/dbname

   # FRED API (required for real-time mortgage rates)
   FRED_API_KEY=your_fred_api_key_here

   # Email notifications (required)
   LEAD_EMAIL_TO=support@example.com
   SMTP_HOST=smtp.yourprovider.com
   SMTP_PORT=587
   SMTP_USER=smtp-user
   SMTP_PASS=smtp-password

   # Auto-configured by render.yaml
   NODE_ENV=production
   PORT=10000
   HOST=0.0.0.0
   ```

3. **Deploy**
   - Click "Apply" to create the service
   - Wait for build and deployment to complete
   - Your MCP server will be available at: `https://your-service.onrender.com/mcp`

### Option 2: Manual Configuration

1. **Create Web Service**
   - Go to Render dashboard
   - Click "New +" → "Web Service"
   - Connect to GitHub repository: `nspadijer/mortgagebroker`
   - Configure:
     - **Name**: mortgagebroker-mcp
     - **Region**: Oregon (US West)
     - **Branch**: main
     - **Runtime**: Node
     - **Build Command**: `npm install && npx prisma generate --schema=infra/prisma/schema.prisma && npm run build && npm run mcp:compile`
     - **Start Command**: `node dist/mcp-server/server.js`

2. **Add Environment Variables** (same as Option 1)

3. **Deploy** and monitor logs

## Database Setup

### Create PostgreSQL Database on Render

1. Go to Render dashboard → "New +" → "PostgreSQL"
2. Create database:
   - **Name**: mortgagebroker-db
   - **Region**: Same as web service (Oregon)
   - **Plan**: Free or Starter
3. Copy the **Internal Database URL**
4. Add to your web service as `DATABASE_URL`

### Run Migrations

After deployment, connect to your Render shell and run:

```bash
npx prisma migrate deploy --schema=infra/prisma/schema.prisma
```

Or set up automatic migrations in your build command:
```bash
npm install && npx prisma generate --schema=infra/prisma/schema.prisma && npx prisma migrate deploy --schema=infra/prisma/schema.prisma && npm run build && npm run mcp:compile
```

## Connect to ChatGPT

1. Get your deployment URL: `https://your-service.onrender.com/mcp`

2. In ChatGPT settings:
   - Go to Settings → ChatGPT → Custom GPTs or MCP
   - Add new MCP server
   - Enter your Render URL

3. Test the connection:
   - Ask: "What are current mortgage rates?"
   - Should return real-time FRED data

## Health Checks

Render will ping `https://your-service.onrender.com/` to verify the service is running.

Expected response:
```
MortgageBroker MCP server
```

## Monitoring

### View Logs
- Go to your service in Render dashboard
- Click "Logs" tab
- Monitor for:
  - `✓ Knowledge base initialized with FRED API integration (prioritized)`
  - `MortgageBroker MCP listening on http://0.0.0.0:10000/mcp`
  - `🔍 [PRIORITY] Checking FRED API first for: ...`

### Check Metrics
- Monitor response times
- Watch for errors in logs
- Check database connection status

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NODE_ENV` | Yes | Environment mode | `production` |
| `PORT` | Yes | Server port (Render default: 10000) | `10000` |
| `HOST` | Yes | Bind address for containers | `0.0.0.0` |
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `FRED_API_KEY` | Yes | Federal Reserve Economic Data API key | Get at https://fred.stlouisfed.org |
| `LEAD_EMAIL_TO` | Yes | Email address for lead notifications | `support@example.com` |
| `SMTP_HOST` | Yes | SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | Yes | SMTP server port | `587` |
| `SMTP_USER` | Yes | SMTP username | `user@gmail.com` |
| `SMTP_PASS` | Yes | SMTP password or app password | `app-password` |

## Troubleshooting

### Build Fails: "Cannot find module '@prisma/client'"
- **Fix**: Ensure `npx prisma generate` is in your build command
- The `render.yaml` already includes this

### Runtime Error: "PrismaClient is not configured"
- **Fix**: Run `npx prisma generate --schema=infra/prisma/schema.prisma` during build
- Check that `DATABASE_URL` is set correctly

### FRED API Returns No Data
- **Fix**: Verify `FRED_API_KEY` is set correctly
- Check logs for API errors: `🔍 [PRIORITY] Checking FRED API first for: ...`
- Test API key at: https://fred.stlouisfed.org/docs/api/fred/

### Email Not Sending
- **Fix**: Verify all SMTP_* environment variables
- For Gmail: Use App Password, not regular password
- Check SMTP_PORT (usually 587 for TLS)

### Health Check Failing
- **Fix**: Ensure server starts and binds to `0.0.0.0:10000`
- Check logs for: `MortgageBroker MCP listening on http://0.0.0.0:10000/mcp`
- Verify `HOST=0.0.0.0` and `PORT=10000` in environment variables

## Local Testing Before Deploy

Test the production build locally:

```bash
# Generate Prisma client
npm run prisma:generate

# Build everything
npm run build:full

# Set environment variables
export DATABASE_URL="postgresql://..."
export FRED_API_KEY="..."
export LEAD_EMAIL_TO="..."
# ... other vars

# Start server
node dist/mcp-server/server.js
```

Test the MCP endpoint:
```bash
curl http://localhost:10000/
# Should return: MortgageBroker MCP server

curl http://localhost:10000/mcp
# Should handle MCP requests
```

## Updating the Deployment

1. **Push changes to GitHub**:
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```

2. **Render auto-deploys** from the main branch
   - Monitor deployment in Render dashboard
   - Check logs for successful startup

3. **Manual redeploy** if needed:
   - Go to Render dashboard → your service
   - Click "Manual Deploy" → "Deploy latest commit"

## Production Checklist

- [ ] Database created and connected
- [ ] All environment variables set
- [ ] FRED API key valid and working
- [ ] Email SMTP configured and tested
- [ ] Health check endpoint responding
- [ ] Build completes successfully
- [ ] Server starts and binds to 0.0.0.0:10000
- [ ] MCP endpoint accessible at /mcp
- [ ] Connected to ChatGPT
- [ ] Test queries return real-time FRED data
- [ ] Lead submissions save to database
- [ ] Email notifications sent successfully

## Support

- **Documentation**: https://code.claude.com/docs/apps-sdk
- **FRED API Docs**: https://fred.stlouisfed.org/docs/api/
- **Render Docs**: https://render.com/docs
- **Repository**: https://github.com/nspadijer/mortgagebroker

## Security Notes

- Never commit `.env` files (already in .gitignore)
- Use Render's environment variable encryption
- Rotate SMTP passwords regularly
- Monitor for unusual API usage
- Keep dependencies updated with `npm audit`
