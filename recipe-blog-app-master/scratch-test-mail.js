/**
 * scratch-test-mail.js
 * Run with:  node scratch-test-mail.js
 *
 * Tests all three SendGrid notification types.
 * Falls back to Ethereal mock if SENDGRID_API_KEY is not configured.
 */

const dotenv = require("dotenv");
dotenv.config();

const {
  sendLikeNotification,
  sendCommentNotification,
  sendRecipeSubmissionNotification,
} = require("./server/utils/mailer");

const TEST_EMAIL  = "swapnilurmaliya794@gmail.com";
const TEST_NAME   = "Swapnil";
const RECIPE_NAME = "Butter Chicken Masala";
const RECIPE_ID   = "6a156f476e81f746c5aa39fe";

async function test() {
  console.log("=============================================================");
  console.log("  Cooking Blog — SendGrid Email Notification Test");
  console.log("=============================================================");
  console.log(`  SENDGRID_API_KEY  : ${process.env.SENDGRID_API_KEY ? "✅ set" : "❌ not set (will use fallback)"}`);
  console.log(`  SENDGRID_TEMPLATE : ${process.env.SENDGRID_TEMPLATE_ID || "❌ not set"}`);
  console.log(`  EMAIL_FROM        : ${process.env.EMAIL_FROM || "(default)"}`);
  console.log("=============================================================\n");

  // ── Test 1: Like Notification ────────────────────────────────────────────
  console.log("🧪 Test 1: Like Notification...");
  try {
    await sendLikeNotification({
      ownerEmail: TEST_EMAIL,
      ownerName:  TEST_NAME,
      recipeName: RECIPE_NAME,
      recipeId:   RECIPE_ID,
      likerName:  "Rahul Sharma",
    });
    console.log("✅ Like notification sent successfully.\n");
  } catch (err) {
    console.error("❌ Like notification failed:", err.message);
    if (err.response) console.error("   SendGrid error body:", JSON.stringify(err.response.body, null, 2));
    console.log();
  }

  // ── Test 2: Comment Notification ─────────────────────────────────────────
  console.log("🧪 Test 2: Comment Notification...");
  try {
    await sendCommentNotification({
      ownerEmail:    TEST_EMAIL,
      ownerName:     TEST_NAME,
      recipeName:    RECIPE_NAME,
      recipeId:      RECIPE_ID,
      commenterName: "Priya Patel",
      commentText:   "This recipe looks absolutely delicious! Can't wait to try it at home 🍛",
    });
    console.log("✅ Comment notification sent successfully.\n");
  } catch (err) {
    console.error("❌ Comment notification failed:", err.message);
    if (err.response) console.error("   SendGrid error body:", JSON.stringify(err.response.body, null, 2));
    console.log();
  }

  // ── Test 3: Recipe Submission Notification ───────────────────────────────
  console.log("🧪 Test 3: Recipe Submission Notification...");
  try {
    await sendRecipeSubmissionNotification({
      ownerEmail: TEST_EMAIL,
      ownerName:  TEST_NAME,
      recipeName: RECIPE_NAME,
      recipeId:   RECIPE_ID,
    });
    console.log("✅ Submission notification sent successfully.\n");
  } catch (err) {
    console.error("❌ Submission notification failed:", err.message);
    if (err.response) console.error("   SendGrid error body:", JSON.stringify(err.response.body, null, 2));
    console.log();
  }

  console.log("=============================================================");
  console.log("  All tests completed.");
  console.log("=============================================================");
}

test().catch((err) => {
  console.error("Unhandled test error:", err);
  process.exit(1);
});
