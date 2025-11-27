# SendGrid Email Setup Guide

## Current Status

✅ **SendGrid API Key**: Configured and valid
❌ **Sender Email**: Not verified - **ACTION REQUIRED**

## Issue Found

SendGrid requires you to verify the sender email address before you can send emails. The error:

```
The from address does not match a verified Sender Identity.
Mail cannot be sent until this error is resolved.
```

## How to Fix

### Option 1: Single Sender Verification (Quick & Easy)

1. **Go to SendGrid Dashboard**
   - Visit: https://app.sendgrid.com/settings/sender_auth/senders
   - Log in with your SendGrid account

2. **Add Sender Identity**
   - Click "Create New Sender" or "Verify Single Sender"
   - Enter the email you want to use: `nikola.cfn@gmail.com`
   - Fill in the required information:
     - From Name: "MortgageBroker App" or your name
     - From Email Address: `nikola.cfn@gmail.com`
     - Reply To: `nikola.cfn@gmail.com` (can be same or different)
     - Company Address, City, State, ZIP, Country

3. **Check Your Email**
   - SendGrid will send a verification email to `nikola.cfn@gmail.com`
   - Click the verification link in the email
   - **IMPORTANT**: Check spam/junk folder if you don't see it

4. **Wait for Approval** (Usually instant)
   - Once verified, the email will show as "Verified" in the dashboard
   - You can now send emails from this address

### Option 2: Domain Authentication (Advanced)

For production use, it's better to authenticate your entire domain:

1. Go to: https://app.sendgrid.com/settings/sender_auth/domain/create
2. Add DNS records to your domain (e.g., nafinc.com)
3. This allows you to send from any email @nafinc.com
4. More professional and better deliverability

## Testing SendGrid Connection

After verifying your sender email, test the connection:

```bash
node --env-file=.env test-sendgrid.js
```

**Expected Output:**
```
✅ Test email sent successfully!
📬 Check your inbox at: nikola.cfn@gmail.com
SendGrid Integration Status: ✅ WORKING
```

## Current Configuration

Your `.env` file should have:

```bash
# Email Configuration (SendGrid)
LEAD_EMAIL_TO="nikola.cfn@gmail.com"        # Where leads are sent
SENDGRID_FROM="nikola.cfn@gmail.com"        # From address (must be verified!)
SENDGRID_API_KEY="SG.DMyHp_i..."            # Your SendGrid API key
```

## Troubleshooting

### "From address does not match verified Sender Identity"
- Go to https://app.sendgrid.com/settings/sender_auth/senders
- Verify that `nikola.cfn@gmail.com` is listed and shows "Verified"
- If not, add it and click the verification link in your email

### "API key does not have permission"
- Go to https://app.sendgrid.com/settings/api_keys
- Create a new API key with "Mail Send" permission (Full Access)
- Update `SENDGRID_API_KEY` in your .env file

### Emails going to spam
- Consider using Domain Authentication (Option 2)
- Add SPF and DKIM records to your domain
- Avoid spam trigger words in email content

### Rate limits
- Free SendGrid plan: 100 emails/day
- Upgrade at https://sendgrid.com/pricing for more volume

## Next Steps

1. ✅ **Verify sender email in SendGrid** (REQUIRED)
2. ✅ **Run test script** to confirm emails are working
3. ✅ **Test lead submission** in ChatGPT widget
4. 📧 **Check email delivery** and spam folder
5. 🚀 **Ready for production** once verified

## Resources

- **SendGrid Dashboard**: https://app.sendgrid.com
- **Sender Authentication**: https://app.sendgrid.com/settings/sender_auth
- **API Keys**: https://app.sendgrid.com/settings/api_keys
- **SendGrid Docs**: https://docs.sendgrid.com
- **Sender Identity Guide**: https://sendgrid.com/docs/for-developers/sending-email/sender-identity

---

## Production Deployment (Render)

When deploying to Render, add these environment variables in the dashboard:

```
LEAD_EMAIL_TO=nikola.cfn@gmail.com
SENDGRID_FROM=nikola.cfn@gmail.com
SENDGRID_API_KEY=<your-api-key>
```

**Note**: Make sure `SENDGRID_FROM` matches the verified sender in SendGrid!
