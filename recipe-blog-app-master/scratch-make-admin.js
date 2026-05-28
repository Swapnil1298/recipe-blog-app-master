/**
 * scratch-make-admin.js
 * 
 * Run with: node scratch-make-admin.js <email_address>
 * Example: node scratch-make-admin.js swapnilurmaliya794@gmail.com
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./server/models/User");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/recipe_blog";

async function makeAdmin() {
  const email = process.argv[2];
  
  if (!email) {
    console.error("❌ Please provide an email address.");
    console.error("Usage: node scratch-make-admin.js <email_address>");
    process.exit(1);
  }

  try {
    console.log(`Connecting to database: ${MONGO_URI}`);
    await mongoose.connect(MONGO_URI);
    console.log("✅ Database connected.");

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.error(`❌ User not found with email: ${email}`);
      console.error("Make sure you have registered an account with this email first.");
    } else {
      user.isAdmin = true;
      await user.save();
      console.log(`✅ Success! User ${user.name} (${user.email}) is now an Admin.`);
      console.log("You can now log in and see the Admin Dashboard.");
    }

  } catch (error) {
    console.error("❌ Database Error:", error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

makeAdmin();
