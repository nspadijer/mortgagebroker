import sgMail from "@sendgrid/mail";

// Note: Run with: node --env-file=.env test-sendgrid.js

const sendGridApiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.SENDGRID_FROM || "nikola.cfn@gmail.com";
const toEmail = process.env.LEAD_EMAIL_TO || "nikola.cfn@gmail.com";

console.log("🧪 Testing SendGrid Email Configuration\n");
console.log("Configuration:");
console.log(`  From: ${fromEmail}`);
console.log(`  To: ${toEmail}`);
console.log(`  API Key: ${sendGridApiKey ? "✅ Configured (" + sendGridApiKey.substring(0, 10) + "...)" : "❌ Missing"}\n`);

if (!sendGridApiKey) {
  console.error("❌ SENDGRID_API_KEY is not configured in .env file");
  process.exit(1);
}

async function testSendGridConnection() {
  try {
    console.log("📧 Sending test email via SendGrid...");

    sgMail.setApiKey(sendGridApiKey);

    const msg = {
      to: toEmail,
      from: {
        email: fromEmail,
        name: "MortgageBroker Test"
      },
      subject: "🧪 SendGrid Test - MortgageBroker App",
      text: "This is a test email from MortgageBroker App to verify SendGrid integration is working correctly.",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #081827; color: #6CE3CF; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">🧪 SendGrid Test Email</h2>
          </div>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
            <p>This is a test email from <strong>MortgageBroker App</strong> to verify that SendGrid email integration is working correctly.</p>
            <p style="margin-top: 20px; padding: 15px; background: #e8f5e9; border-radius: 4px;">
              ✅ <strong>Success!</strong> If you're reading this, SendGrid is configured properly and emails are being delivered.
            </p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;" />
            <p style="font-size: 12px; color: #666;">
              Sent from: ${fromEmail}<br/>
              Delivered to: ${toEmail}<br/>
              Timestamp: ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      `
    };

    await sgMail.send(msg);

    console.log("✅ Test email sent successfully!");
    console.log("\n📬 Check your inbox at:", toEmail);
    console.log("\nSendGrid Integration Status: ✅ WORKING\n");

  } catch (error) {
    console.error("\n❌ Failed to send test email\n");

    if (error.response) {
      console.error("SendGrid API Error:");
      console.error("  Status:", error.response.status);
      console.error("  Body:", JSON.stringify(error.response.body, null, 2));
    } else {
      console.error("Error:", error.message);
    }

    console.error("\nCommon Issues:");
    console.error("  1. Invalid API Key - Check SENDGRID_API_KEY in .env");
    console.error("  2. Unverified Sender - Verify sender email in SendGrid dashboard");
    console.error("  3. SendGrid Account - Ensure account is active and not suspended");
    console.error("\nSendGrid Integration Status: ❌ NOT WORKING\n");

    process.exit(1);
  }
}

testSendGridConnection();
