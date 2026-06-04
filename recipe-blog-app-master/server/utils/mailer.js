"use strict";

/**
 * mailer.js — Unified Email Utility
 *
 * Priority order:
 *  1. SendGrid API  (SENDGRID_API_KEY set in .env)  ← primary
 *  2. Custom SMTP   (SMTP_HOST + SMTP_USER + SMTP_PASS)
 *  3. Gmail SMTP    (EMAIL_USER + EMAIL_PASS)
 *  4. Ethereal      (auto test account — zero config fallback)
 */

const nodemailer = require("nodemailer");

// ── SendGrid SDK (only loaded when key is present) ─────────────────────────
let sgMail = null;
let useSendGrid = false;

// ── Nodemailer fallback state ──────────────────────────────────────────────
let transporter = null;
let isMock = false;

// ── Helper: detect placeholder / empty values ──────────────────────────────
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

// ── Bootstrap SendGrid ─────────────────────────────────────────────────────
function initSendGrid() {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (apiKey && !isPlaceholder(apiKey)) {
    try {
      sgMail = require("@sendgrid/mail");
      sgMail.setApiKey(apiKey);
      useSendGrid = true;
      console.log("✅ Mailer: SendGrid API configured.");
    } catch (e) {
      console.error("⚠️  Mailer: @sendgrid/mail not installed. Falling back to SMTP.", e.message);
      useSendGrid = false;
    }
  }
}

// ── Bootstrap Nodemailer fallback transporter ──────────────────────────────
async function getTransporter() {
  if (transporter) return transporter;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT || 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (smtpHost && !isPlaceholder(smtpUser) && !isPlaceholder(smtpPass)) {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort, 10),
      secure: smtpPort == 465,
      auth: { user: smtpUser, pass: smtpPass },
    });
    isMock = false;
    console.log(`✅ Mailer: SMTP configured via ${smtpHost}`);
  } else if (emailUser && !isPlaceholder(emailUser) && !isPlaceholder(emailPass)) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: emailUser, pass: emailPass },
    });
    isMock = false;
    console.log("✅ Mailer: Gmail SMTP configured.");
  } else {
    // Ethereal auto-test-account fallback
    try {
      console.log("⚠️  Mailer: No SMTP credentials found. Creating Ethereal test account...");
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      isMock = true;
      console.log("✅ Mailer: Ethereal test account ready (mock mode).");
    } catch (err) {
      console.error("❌ Mailer: Failed to create Ethereal account:", err.message);
      transporter = {
        sendMail: async (options) => {
          console.log("🚫 Dummy Transporter — email not sent:", options);
          return {};
        },
      };
      isMock = false;
    }
  }
  return transporter;
}

// Run SendGrid init immediately (synchronous check)
initSendGrid();

// ── Shared HTML wrapper (used by Nodemailer fallback only) ─────────────────
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

// ── Internal: send via SendGrid dynamic template ───────────────────────────
async function sendViaSendGrid({ to, subject, templateData }) {
  const templateId = process.env.SENDGRID_TEMPLATE_ID;
  const fromEmail  = process.env.EMAIL_FROM || "no-reply@cookingblog.com";

  const msg = {
    to,
    from: { email: fromEmail, name: "Cooking Blog 🍳" },
    subject,
    templateId,
    dynamicTemplateData: templateData,
  };

  await sgMail.send(msg);
  console.log(`📧 SendGrid: email sent to ${to} | subject: "${subject}"`);
}

// ── Internal: send via Nodemailer (fallback) ───────────────────────────────
async function sendViaNodemailer({ to, subject, html }) {
  const client      = await getTransporter();
  const defaultFrom = process.env.SMTP_USER || process.env.EMAIL_USER || "no-reply@cookingblog.com";
  const fromEmail   = isMock ? "mock@cookingblog.com" : (process.env.EMAIL_FROM || defaultFrom);

  const info = await client.sendMail({
    from: `"Cooking Blog 🍳" <${fromEmail}>`,
    to,
    subject,
    html,
  });

  if (isMock && info && nodemailer.getTestMessageUrl) {
    console.log("\n-------------------------------------------------------------");
    console.log("✉️  EMAIL NOTIFICATION GENERATED (TEST / MOCK MODE)");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    console.log("-------------------------------------------------------------\n");
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ── Public API ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

/**
 * sendLikeNotification
 * Notifies a recipe owner that someone liked their recipe.
 */
async function sendLikeNotification({ ownerEmail, ownerName, recipeName, recipeId, likerName }) {
  const recipeUrl = `http://localhost:3000/recipe/${recipeId}`;
  const subject   = `❤️ ${likerName} liked your recipe "${recipeName}"`;

  if (useSendGrid) {
    await sendViaSendGrid({
      to:   ownerEmail,
      subject,
      templateData: {
        notification_type: "New Like",
        emoji:             "❤️",
        heading:           "Someone liked your recipe!",
        owner_name:        ownerName,
        actor_name:        likerName,
        recipe_name:       recipeName,
        recipe_url:        recipeUrl,
        action_label:      "View Your Recipe →",
        message:           `${likerName} just liked your recipe "${recipeName}". 🎉`,
      },
    });
    return;
  }

  // Nodemailer fallback HTML
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

  await sendViaNodemailer({ to: ownerEmail, subject, html: htmlWrapper(body) });
}

/**
 * sendCommentNotification
 * Notifies a recipe owner that someone left a comment.
 */
async function sendCommentNotification({ ownerEmail, ownerName, recipeName, recipeId, commenterName, commentText }) {
  const recipeUrl = `http://localhost:3000/recipe/${recipeId}`;
  const subject   = `💬 ${commenterName} commented on your recipe "${recipeName}"`;

  if (useSendGrid) {
    await sendViaSendGrid({
      to:   ownerEmail,
      subject,
      templateData: {
        notification_type: "New Comment",
        emoji:             "💬",
        heading:           "Someone commented on your recipe!",
        owner_name:        ownerName,
        actor_name:        commenterName,
        recipe_name:       recipeName,
        recipe_url:        recipeUrl,
        action_label:      "Read Full Comment →",
        comment_text:      commentText,
        message:           `${commenterName} left a comment on your recipe "${recipeName}".`,
        avatar_initial:    commenterName.charAt(0).toUpperCase(),
      },
    });
    return;
  }

  // Nodemailer fallback HTML
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

  await sendViaNodemailer({ to: ownerEmail, subject, html: htmlWrapper(body) });
}

/**
 * sendRatingNotification
 * Notifies a recipe owner that someone rated their recipe.
 */
async function sendRatingNotification({ ownerEmail, ownerName, recipeName, recipeId, raterName, ratingValue }) {
  const recipeUrl = `http://localhost:3000/recipe/${recipeId}`;
  const subject = `${raterName} rated your recipe "${recipeName}"`;

  if (useSendGrid) {
    await sendViaSendGrid({
      to: ownerEmail,
      subject,
      templateData: {
        notification_type: "New Rating",
        emoji: "⭐",
        heading: "Someone rated your recipe!",
        owner_name: ownerName,
        actor_name: raterName,
        recipe_name: recipeName,
        recipe_url: recipeUrl,
        action_label: "View Your Recipe",
        rating_value: ratingValue,
        message: `${raterName} rated your recipe "${recipeName}" ${ratingValue}/5 stars.`,
      },
    });
    return;
  }

  const body = `
    <p style="margin:0 0 6px;color:#888;font-size:13px;text-transform:uppercase;letter-spacing:1px;">New Rating</p>
    <h2 style="margin:0 0 20px;color:#1a1a2e;font-size:22px;font-weight:800;">
      Someone rated your recipe!
    </h2>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#fff8f4;border-radius:12px;padding:20px;border-left:4px solid #eb6928;margin-bottom:24px;">
      <tr>
        <td>
          <p style="margin:0 0 8px;color:#555;font-size:14px;">
            Hi <strong style="color:#1a1a2e;">${ownerName}</strong>,
          </p>
          <p style="margin:0;color:#555;font-size:14px;line-height:1.6;">
            <strong style="color:#eb6928;">${raterName}</strong>
            rated your recipe
            <strong style="color:#1a1a2e;">"${recipeName}"</strong>
            <strong style="color:#1a1a2e;">${ratingValue}/5 stars</strong>.
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
        View Your Recipe
      </a>
    </div>`;

  await sendViaNodemailer({ to: ownerEmail, subject, html: htmlWrapper(body) });
}

/**
 * sendRecipeSubmissionNotification
 * Notifies the recipe author that their recipe was successfully submitted.
 */
async function sendRecipeSubmissionNotification({ ownerEmail, ownerName, recipeName, recipeId }) {
  const recipeUrl = `http://localhost:3000/recipe/${recipeId}`;
  const subject   = `🍳 Your recipe "${recipeName}" has been published!`;

  if (useSendGrid) {
    await sendViaSendGrid({
      to:   ownerEmail,
      subject,
      templateData: {
        notification_type: "Recipe Published",
        emoji:             "🍳",
        heading:           "Your recipe is live!",
        owner_name:        ownerName,
        recipe_name:       recipeName,
        recipe_url:        recipeUrl,
        action_label:      "View Your Recipe →",
        message:           `Congratulations! Your recipe "${recipeName}" has been successfully published on Cooking Blog.`,
      },
    });
    return;
  }

  // Nodemailer fallback HTML
  const body = `
    <p style="margin:0 0 6px;color:#888;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Recipe Published</p>
    <h2 style="margin:0 0 20px;color:#1a1a2e;font-size:22px;font-weight:800;">
      🍳 Your recipe is live!
    </h2>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#fff8f4;border-radius:12px;padding:20px;border-left:4px solid #eb6928;margin-bottom:24px;">
      <tr>
        <td>
          <p style="margin:0 0 8px;color:#555;font-size:14px;">
            Hi <strong style="color:#1a1a2e;">${ownerName}</strong>,
          </p>
          <p style="margin:0;color:#555;font-size:14px;line-height:1.6;">
            🎉 Congratulations! Your recipe
            <strong style="color:#1a1a2e;">"${recipeName}"</strong>
            has been successfully published on Cooking Blog.
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

  await sendViaNodemailer({ to: ownerEmail, subject, html: htmlWrapper(body) });
}

module.exports = {
  sendLikeNotification,
  sendCommentNotification,
  sendRatingNotification,
  sendRecipeSubmissionNotification,
};
