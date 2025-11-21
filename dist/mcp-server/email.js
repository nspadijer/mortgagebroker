import { createTransport } from "nodemailer";
import { promises as fs } from "node:fs";
import path from "node:path";
export async function sendLeadEmail(lead, intake) {
    const emailTo = process.env.LEAD_EMAIL_TO || "nikola.spadijer@nafinc.com";
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || "587");
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    // Log lead to file
    await logLeadToFile(lead);
    // If SMTP is not configured, just log and return
    if (!smtpHost || !smtpUser || !smtpPass) {
        console.log(`✉️  Lead captured: ${lead.fullName} (${lead.email}) - Email would be sent to ${emailTo}`);
        console.log(`⚠️  SMTP not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in .env to enable email sending.`);
        return;
    }
    // Helper functions to format intake values
    const formatPurpose = (purpose) => {
        const purposeMap = {
            purchase: "Purchase",
            refinance: "Rate/Term Refinance",
            cashout: "Cash-out Refinance",
            secondhome: "Second Home",
            investment: "Investment Property"
        };
        return purposeMap[purpose] || purpose;
    };
    const formatOccupancy = (occupancy) => {
        const occupancyMap = {
            primary: "Primary Residence",
            secondhome: "Second Home",
            investment: "Investment"
        };
        return occupancyMap[occupancy] || occupancy;
    };
    const formatPropertyType = (propertyType) => {
        const propertyMap = {
            singlefamily: "Single Family",
            condo: "Condo",
            townhome: "Townhome",
            multiunit: "2–4 Unit"
        };
        return propertyMap[propertyType] || propertyType;
    };
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
    };
    // Create email content
    const subject = `New Mortgage Lead: ${lead.fullName}`;
    const intakeSection = intake ? `
      <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #6CE3CF;">
        <h3 style="color: #081827; margin-bottom: 15px;">📋 Loan Preferences</h3>
        <div class="field">
          <span class="field-label">Loan Purpose:</span>
          <span class="field-value">${formatPurpose(intake.purpose)}</span>
        </div>
        <div class="field">
          <span class="field-label">Occupancy:</span>
          <span class="field-value">${formatOccupancy(intake.occupancy)}</span>
        </div>
        <div class="field">
          <span class="field-label">Property Type:</span>
          <span class="field-value">${formatPropertyType(intake.propertyType)}</span>
        </div>
        ${intake.estPrice ? `
        <div class="field">
          <span class="field-label">Estimated Price:</span>
          <span class="field-value">${formatCurrency(intake.estPrice)}</span>
        </div>` : ''}
        ${intake.estDownPayment ? `
        <div class="field">
          <span class="field-label">Estimated Down Payment:</span>
          <span class="field-value">${formatCurrency(intake.estDownPayment)}</span>
        </div>` : ''}
      </div>` : '';
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #081827; color: #6CE3CF; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
    .field { margin: 15px 0; padding: 10px; background: white; border-left: 4px solid #6CE3CF; }
    .field-label { font-weight: bold; color: #081827; display: block; margin-bottom: 5px; }
    .field-value { color: #333; }
    .consent { background: #e8f5e9; padding: 10px; margin-top: 20px; border-radius: 4px; }
    .timestamp { color: #666; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">🏠 New Mortgage Lead from MortgageBroker App</h2>
    </div>
    <div class="content">
      <h3 style="color: #081827; margin-bottom: 15px;">👤 Contact Information</h3>
      <div class="field">
        <span class="field-label">Full Name:</span>
        <span class="field-value">${lead.fullName}</span>
      </div>
      <div class="field">
        <span class="field-label">Email:</span>
        <span class="field-value"><a href="mailto:${lead.email}">${lead.email}</a></span>
      </div>
      <div class="field">
        <span class="field-label">Phone:</span>
        <span class="field-value"><a href="tel:${lead.phone}">${lead.phone}</a></span>
      </div>
      ${intakeSection}
      <div class="consent">
        <strong>✅ TCPA Consent:</strong> ${lead.consent ? "Yes, explicit consent provided" : "No"}
        <p style="font-size: 12px; margin-top: 10px; color: #666;">
          The lead has agreed to be contacted by MortgageBroker and New American Funding via calls, emails, and texts (including autodialer and prerecorded messages).
        </p>
      </div>
      <div class="timestamp">
        <strong>Submitted:</strong> ${new Date(lead.createdAt).toLocaleString("en-US", {
        timeZone: "America/New_York",
        dateStyle: "full",
        timeStyle: "long"
    })}
      </div>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
        <p>This lead was captured through the MortgageBroker ChatGPT integration.</p>
        <p><strong>Next Steps:</strong> Follow up within 24 hours for best conversion rates.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
    const intakeText = intake ? `

LOAN PREFERENCES:
Loan Purpose: ${formatPurpose(intake.purpose)}
Occupancy: ${formatOccupancy(intake.occupancy)}
Property Type: ${formatPropertyType(intake.propertyType)}${intake.estPrice ? `
Estimated Price: ${formatCurrency(intake.estPrice)}` : ''}${intake.estDownPayment ? `
Estimated Down Payment: ${formatCurrency(intake.estDownPayment)}` : ''}
` : '';
    const textContent = `
New Mortgage Lead from MortgageBroker App

CONTACT INFORMATION:
Full Name: ${lead.fullName}
Email: ${lead.email}
Phone: ${lead.phone}${intakeText}

TCPA Consent: ${lead.consent ? "Yes" : "No"}

Submitted: ${new Date(lead.createdAt).toLocaleString()}

This lead was captured through the MortgageBroker ChatGPT integration.
Next Steps: Follow up within 24 hours for best conversion rates.
  `.trim();
    try {
        // Create transporter
        const transporter = createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
                user: smtpUser,
                pass: smtpPass
            }
        });
        // Send email
        await transporter.sendMail({
            from: `MortgageBroker App <${smtpUser}>`,
            to: emailTo,
            subject,
            text: textContent,
            html: htmlContent,
            replyTo: lead.email
        });
        console.log(`✅ Lead email sent to ${emailTo} for ${lead.fullName}`);
    }
    catch (error) {
        console.error("❌ Failed to send lead email:", error);
        // Don't throw - we don't want to block the user flow if email fails
    }
}
async function logLeadToFile(lead) {
    const logDir = path.resolve(process.cwd(), "logs");
    const logFile = path.join(logDir, "leads.log");
    // Ensure logs directory exists
    try {
        await fs.mkdir(logDir, { recursive: true });
    }
    catch (err) {
        // Directory might already exist
    }
    const logEntry = `${new Date().toISOString()} | ${lead.fullName} | ${lead.email} | ${lead.phone} | Consent: ${lead.consent}\n`;
    try {
        await fs.appendFile(logFile, logEntry);
    }
    catch (error) {
        console.error("Failed to write to lead log file:", error);
    }
}
