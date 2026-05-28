const dotenv = require("dotenv");
dotenv.config();
const { sendLikeNotification } = require("./server/utils/mailer");

async function test() {
  console.log("Testing email sending using environment variables (with Ethereal fallback):");
  try {
    await sendLikeNotification({
      ownerEmail: "swapnilurmaliya794@gmail.com",
      ownerName: "Swapnil",
      recipeName: "Test Recipe",
      recipeId: "6a156f476e81f746c5aa39fe",
      likerName: "Test Liker",
    });
    console.log("Test execution finished successfully.");
  } catch (err) {
    console.error("Test execution failed with error:");
    console.error(err);
  }
}

test();
