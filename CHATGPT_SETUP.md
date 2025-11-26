# Connect MortgageBroker MCP to ChatGPT

Your MortgageBroker MCP server is now live and ready to connect to ChatGPT! 🎉

## ✅ Deployment Status

**Production URL**: https://mortgagebroker.onrender.com
**MCP Endpoint**: https://mortgagebroker.onrender.com/mcp
**Status**: ✅ Live and operational

**Features Active:**
- ✅ Real-time mortgage rates from FRED API (30Y, 15Y, Fed Funds Rate)
- ✅ 24 economic indicators (housing market, CPI, unemployment, GDP, etc.)
- ✅ Mortgage calculator with payment/interest/payoff calculations
- ✅ Lead capture with TCPA compliance
- ✅ Email notifications to nikola.cfn@gmail.com
- ✅ Secure handoff to New American Funding portal

---

## 🔗 Connect to ChatGPT

### Option 1: Using app.json File

1. **Go to ChatGPT Settings**
   - Click your profile in ChatGPT
   - Go to Settings → ChatGPT → Customize ChatGPT (or similar)

2. **Add MCP Server**
   - Look for "Connect Apps" or "Add MCP Server"
   - Upload your `appsdk/app.json` file
   - OR manually enter the URL: `https://mortgagebroker.onrender.com/mcp`

3. **Verify Connection**
   - ChatGPT should show "MortgageBroker" as available
   - Test with: "What are current mortgage rates?"

### Option 2: Manual Configuration

If ChatGPT asks for manual configuration:

**Server Name**: MortgageBroker
**Server URL**: https://mortgagebroker.onrender.com/mcp
**Transport Type**: HTTPS
**Description**: Mortgage pre-qualification with real-time FRED data

---

## 🧪 Test Your Integration

Once connected, try these queries in ChatGPT:

### 1. Test FRED API Integration
**Ask**: "What are current mortgage rates?"

**Expected Response**:
```
📊 Current Mortgage Rates (from FRED):
• 30-Year Fixed: 6.26% (as of 2025-11-20)
• 15-Year Fixed: 5.54% (as of 2025-11-20)
• Federal Funds Rate: 4.09% (as of 2025-10-01)
```

### 2. Test Mortgage Calculator
**Ask**: "Calculate monthly payment for a $400,000 loan at 6.5% for 30 years"

**Expected Response**:
```
Estimated payment is $2,528.27 for 30 years with 6.5% interest.
Total paid: $910,178.20
Total interest: $510,178.20
```

### 3. Test Knowledge Base
**Ask**: "What documents do I need for mortgage pre-approval?"

**Expected Response**: List of required documents (pay stubs, W-2s, bank statements, etc.)

### 4. Test Economic Data
**Ask**: "What's the current housing market situation?"

**Expected Response**: Real-time housing data from FRED (median prices, housing starts, sales, inventory)

### 5. Test Full Flow
**Ask**: "I want to buy a house. Can you help me understand the process?"

**Expected**: Interactive conversation → calculator → lead capture → handoff to NAF portal

---

## 📋 Available Tools in ChatGPT

Your MCP server exposes these tools:

1. **mortgageAdvisor** - Answers questions using FRED API + knowledge base
2. **mortgageCalculator** - Calculates monthly payments, interest, payoff
3. **submitLead** - Captures lead with TCPA consent + intake data
4. **saveIntake** - Saves borrower preferences (purpose, occupancy, property type, pricing)
5. **startPrequalSession** - Returns secure NAF application URL

---

## 🎯 Expected User Experience

### Step 1: Question & Education
User: "What are current mortgage rates?"
→ ChatGPT calls `mortgageAdvisor` → Returns real-time FRED data

### Step 2: Calculations
User: "Calculate my payment"
→ ChatGPT calls `mortgageCalculator` → Returns payment breakdown

### Step 3: Lead Capture
ChatGPT asks for: Name, Email, Phone, Consent
→ Calls `submitLead` with intake data (if provided)
→ Email sent to nikola.cfn@gmail.com

### Step 4: Secure Handoff
ChatGPT: "Ready to start your application?"
→ Calls `startPrequalSession`
→ Returns: https://apply.newamericanfunding.com/apply/nikola-spadijer/account?utm_source=mortgagebroker_app&utm_medium=chatgpt&utm_campaign=prequal_flow

---

## 🔧 Troubleshooting

### ChatGPT Can't Connect

**Issue**: "Unable to connect to MCP server"

**Solutions**:
1. Verify Render service is live: https://mortgagebroker.onrender.com/
   - Should return: "MortgageBroker MCP server"
2. Check Render logs for errors
3. Verify service didn't spin down (free tier sleeps after 15min inactivity)
4. First request after sleep takes 30-60 seconds

### FRED API Returns Old Data

**Issue**: Data seems outdated

**Solutions**:
1. FRED updates data daily (not real-time tick-by-tick)
2. Some series update weekly/monthly (check FRED website)
3. Verify FRED_API_KEY is set in Render Environment Variables
4. Check Render logs for FRED API errors

### Email Notifications Not Received

**Issue**: Lead submissions not sending email

**Solutions**:
1. Check SMTP credentials in Render Environment Variables
2. For Gmail: Must use App Password, not regular password
3. Check Render logs for email errors
4. Verify SMTP_HOST=smtp.gmail.com, SMTP_PORT=587

### Tools Not Showing in ChatGPT

**Issue**: ChatGPT doesn't recognize tools

**Solutions**:
1. Refresh/reconnect the MCP server in ChatGPT settings
2. Re-upload app.json file
3. Check that app.json URL matches your Render deployment
4. Verify /mcp endpoint is accessible

---

## 📊 Monitoring Your Deployment

### Check Service Health
```bash
curl https://mortgagebroker.onrender.com/
# Expected: MortgageBroker MCP server
```

### View Render Logs
Go to: https://dashboard.render.com → Your Service → Logs

**Look for:**
```
✓ Knowledge base initialized with FRED API integration (prioritized)
MortgageBroker MCP listening on http://0.0.0.0:10000/mcp
🔍 [PRIORITY] Checking FRED API first for: ...
✅ FRED API data found - using as primary source
```

### Monitor Lead Submissions
- Check email: nikola.cfn@gmail.com
- Check Render logs for: `📥 submitLead received input:`
- Database: View in Render PostgreSQL (if configured)

---

## 🚀 Production Checklist

Before launching to users:

- [x] MCP server deployed to Render
- [x] FRED API integrated and working
- [x] Email notifications configured
- [x] app.json updated with production URL
- [x] Connected to ChatGPT
- [ ] Test all 5 tools in ChatGPT
- [ ] Test full user flow (question → calc → lead → handoff)
- [ ] Verify email notifications are received
- [ ] Test FRED API returns real-time data
- [ ] Set up monitoring/alerts (optional)
- [ ] Document for your team (optional)

---

## 📞 Support & Resources

**Your Deployment**:
- Dashboard: https://dashboard.render.com
- Logs: https://dashboard.render.com → Your Service → Logs
- Environment: https://dashboard.render.com → Your Service → Environment

**FRED API**:
- Dashboard: https://fred.stlouisfed.org/docs/api/
- API Key: 2f9c89020536e51638ff014cfac64b4e
- Data: https://fred.stlouisfed.org/

**Documentation**:
- MCP SDK: https://modelcontextprotocol.io/
- ChatGPT Apps: https://platform.openai.com/docs/chatgpt
- Render Docs: https://render.com/docs

**Repository**:
- GitHub: https://github.com/nspadijer/mortgagebroker
- Latest Commit: f891d46

---

## 🎉 You're Ready!

Your MortgageBroker MCP is fully deployed and ready to use with ChatGPT!

**Next Steps:**
1. Connect to ChatGPT using the instructions above
2. Test with sample queries
3. Share with your team
4. Monitor lead submissions
5. Iterate based on user feedback

**Key URLs:**
- Production: https://mortgagebroker.onrender.com/mcp
- NAF Portal: https://apply.newamericanfunding.com/apply/nikola-spadijer/account
- Email: nikola.cfn@gmail.com

Happy mortgage brokering! 🏡
