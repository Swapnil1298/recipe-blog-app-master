"use strict";

const nodemailer = require("nodemailer");

let transporter = null;
let isMock = false;

// ── Helper to check if a value is a default placeholder ───────────────────
function isPlaceholder(value) {
  if (!value) return true;
  const val = value.trim().toLowerCase();
  return (
    val === "" ||
    val.includes("your_") ||
    val.includes("placeholder") ||
    val === "your_gmail@gmail.com" ||
    val === "your_gmail_app_password" ||
    val === "your_brevo_smtp_login" ||
    val === "your_brevo_smtp_key" ||
    val === "your_smtp_username"
  );
}

// ── Transporter Initializer ─────────────────────────────────────────────────
async function getTransporter() {
  if (transporter) return transporter;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT || 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  // Check if custom SMTP has non-placeholder credentials
  if (smtpHost && !isPlaceholder(smtpUser) && !isPlaceholder(smtpPass)) {
    // Generic SMTP configuration (Brevo, SendGrid, Mailgun, etc.)
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort, 10),
      secure: smtpPort == 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
    isMock = false;
    console.log(`Mailer configured with SMTP host: ${smtpHost}`);
  } else if (emailUser && !isPlaceholder(emailUser) && !isPlaceholder(emailPass)) {
    // Gmail configuration fallback
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
    isMock = false;
    console.log("Mailer configured with Gmail SMTP.");
  } else {
    // Fallback to Ethereal Email (mock)
    try {
      console.log("No custom SMTP or Gmail credentials configured. Creating a temporary test email account...");
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      isMock = true;
      console.log("Mock Mailer initialized with Ethereal Email.");
    } catch (err) {
      console.error("Failed to create Ethereal test email account:", err.message);
      // Fallback to dummy transporter so it doesn't throw
      transporter = {
        sendMail: async (options) => {
          console.log("Dummy Transporter - Email not sent. Options:", options);
          return {};
        }
      };
      isMock = false;
    }
  }
  return transporter;
}

// ── Shared HTML wrapper ────────────────────────────────────────────────────
function htmlWrapper(bodyContent) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cooking Blog Notification</title>
  </head>
  <body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:30px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0"
                 style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">

            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,#1a1a2e 0%,#eb6928 70%,#f4a261 100%);padding:36px 40px;text-align:center;">
                <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">
                  🍳 Cooking Blog
                </h1>
                <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:13px;letter-spacing:1px;text-transform:uppercase;">
                  Recipe Notification
                </p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:36px 40px;">
                ${bodyContent}
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:#fafafa;border-top:1px solid #f0f0f0;padding:20px 40px;text-align:center;">
                <p style="margin:0;color:#aaa;font-size:12px;">
                  You're receiving this because you posted a recipe on
                  <a href="http://localhost:3000" style="color:#eb6928;text-decoration:none;">Cooking Blog</a>.
                  &nbsp;·&nbsp;
                  <a href="http://localhost:3000" style="color:#eb6928;text-decoration:none;">Visit Site</a>
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`;
}

// ── Send Like Notification ──────────────────────────────────────────────────
async function sendLikeNotification({ ownerEmail, ownerName, recipeName, recipeId, likerName }) {
  const recipeUrl = `http://localhost:3000/recipe/${recipeId}`;

  const body = `
    <p style="margin:0 0 6px;color:#888;font-size:13px;text-transform:uppercase;letter-spacing:1px;">New Like</p>
    <h2 style="margin:0 0 20px;color:#1a1a2e;font-size:22px;font-weight:800;">
      ❤️ Someone liked your recipe!
    </h2>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#fff8f4;border-radius:12px;padding:20px;border-left:4px solid #eb6928;margin-bottom:24px;">
      <tr>
        <td>
          <p style="margin:0 0 8px;color:#555;font-size:14px;">
            Hi <strong style="color:#1a1a2e;">${ownerName}</strong>,
          </p>
          <p style="margin:0;color:#555;font-size:14px;line-height:1.6;">
            <strong style="color:#eb6928;">${likerName}</strong>
            just liked your recipe
            <strong style="color:#1a1a2e;">"${recipeName}"</strong>. 🎉
          </p>
        </td>
      </tr>
    </table>

    <div style="text-align:center;margin-top:8px;">
      <a href="${recipeUrl}"
         style="display:inline-block;background:linear-gradient(135deg,#eb6928,#f4a261);
                color:#fff;text-decoration:none;padding:14px 36px;border-radius:50px;
                font-weight:700;font-size:15px;letter-spacing:0.3px;
                box-shadow:0 4px 16px rgba(235,105,40,0.35);">
        View Your Recipe →
      </a>
    </div>`;

  const client = await getTransporter();
  const defaultSender = process.env.SMTP_USER || process.env.EMAIL_USER || "no-reply@cookingblog.com";
  const fromEmail = isMock ? "mock@cookingblog.com" : (process.env.EMAIL_FROM || defaultSender);
  
  const info = await client.sendMail({
    from: `"Cooking Blog 🍳" <${fromEmail}>`,
    to: ownerEmail,
    subject: `❤️ ${likerName} liked your recipe "${recipeName}"`,
    html: htmlWrapper(body),
  });

  if (isMock && info && nodemailer.getTestMessageUrl) {
    console.log("\n-------------------------------------------------------------");
    console.log("✉️ EMAIL NOTIFICATION GENERATED (TEST MODE)");
    console.log(`To: ${ownerEmail}`);
    console.log(`Subject: ❤️ ${likerName} liked your recipe "${recipeName}"`);
    console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    console.log("-------------------------------------------------------------\n");
  }
}

// ── Send Comment Notification ───────────────────────────────────────────────
async function sendCommentNotification({ ownerEmail, ownerName, recipeName, recipeId, commenterName, commentText }) {
  const recipeUrl = `http://localhost:3000/recipe/${recipeId}`;

  const body = `
    <p style="margin:0 0 6px;color:#888;font-size:13px;text-transform:uppercase;letter-spacing:1px;">New Comment</p>
    <h2 style="margin:0 0 20px;color:#1a1a2e;font-size:22px;font-weight:800;">
      💬 Someone commented on your recipe!
    </h2>

    <p style="margin:0 0 16px;color:#555;font-size:14px;line-height:1.6;">
      Hi <strong style="color:#1a1a2e;">${ownerName}</strong>,<br/>
      <strong style="color:#eb6928;">${commenterName}</strong> left a comment on your recipe
      <strong style="color:#1a1a2e;">"${recipeName}"</strong>:
    </p>

    <!-- Comment bubble -->
    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#f9f9f9;border-radius:12px;padding:20px;
                  border-left:4px solid #eb6928;margin-bottom:24px;">
      <tr>
        <td>
          <!-- Avatar + name row -->
          <table cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
            <tr>
              <td style="vertical-align:middle;">
                <div style="width:40px;height:40px;border-radius:50%;
                            background:linear-gradient(135deg,#eb6928,#f4a261);
                            display:inline-flex;align-items:center;justify-content:center;
                            color:#fff;font-weight:800;font-size:18px;text-align:center;
                            line-height:40px;width:40px;">
                  ${commenterName.charAt(0).toUpperCase()}
                </div>
              </td>
              <td style="vertical-align:middle;padding-left:12px;">
                <strong style="color:#1a1a2e;font-size:14px;">${commenterName}</strong>
              </td>
            </tr>
          </table>
          <p style="margin:0;color:#333;font-size:15px;line-height:1.7;
                    white-space:pre-line;font-style:italic;">
            "${commentText}"
          </p>
        </td>
      </tr>
    </table>

    <div style="text-align:center;margin-top:8px;">
      <a href="${recipeUrl}"
         style="display:inline-block;background:linear-gradient(135deg,#eb6928,#f4a261);
                color:#fff;text-decoration:none;padding:14px 36px;border-radius:50px;
                font-weight:700;font-size:15px;letter-spacing:0.3px;
                box-shadow:0 4px 16px rgba(235,105,40,0.35);">
        Read Full Comment →
      </a>
    </div>`;

  const client = await getTransporter();
  const defaultSender = process.env.SMTP_USER || process.env.EMAIL_USER || "no-reply@cookingblog.com";
  const fromEmail = isMock ? "mock@cookingblog.com" : (process.env.EMAIL_FROM || defaultSender);
  
  const info = await client.sendMail({
    from: `"Cooking Blog 🍳" <${fromEmail}>`,
    to: ownerEmail,
    subject: `💬 ${commenterName} commented on your recipe "${recipeName}"`,
    html: htmlWrapper(body),
  });

  if (isMock && info && nodemailer.getTestMessageUrl) {
    console.log("\n-------------------------------------------------------------");
    console.log("✉️ EMAIL NOTIFICATION GENERATED (TEST MODE)");
    console.log(`To: ${ownerEmail}`);
    console.log(`Subject: 💬 ${commenterName} commented on your recipe "${recipeName}"`);
    console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    console.log("-------------------------------------------------------------\n");
  }
}

module.exports = { sendLikeNotification, sendCommentNotification };
