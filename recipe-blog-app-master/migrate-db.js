/**
 * migrate-db.js
 * 
 * This script copies your local database to your production database.
 * 
 * Usage:
 * 1. Open your terminal.
 * 2. Run the script and pass your Render/Atlas MongoDB URI:
 *    node migrate-db.js "mongodb+srv://<username>:<password>@cluster.mongodb.net/..."
 */

const mongoose = require("mongoose");
const Category = require("./server/models/Category");
const Recipe = require("./server/models/Recipe");
const User = require("./server/models/User");

async function migrate() {
  const remoteUri = process.argv[2];
  if (!remoteUri) {
    console.error("❌ Please provide your production MongoDB URI as an argument.");
    console.error('Example: node migrate-db.js "mongodb+srv://..."');
    process.exit(1);
  }

  const localUri = "mongodb://localhost:27017/recipe_blog";

  try {
    // 1. Connect to Local DB and fetch all data
    console.log("📡 Connecting to LOCAL database...");
    const localDb = await mongoose.createConnection(localUri).asPromise();
    
    // Register models on local connection
    const LocalCategory = localDb.model("Category", Category.schema);
    const LocalRecipe = localDb.model("Recipe", Recipe.schema);
    const LocalUser = localDb.model("User", User.schema);

    console.log("📥 Fetching local data...");
    const categories = await LocalCategory.find({}).lean();
    const recipes = await LocalRecipe.find({}).lean();
    const users = await LocalUser.find({}).lean();

    console.log(`Found: ${users.length} users, ${categories.length} categories, ${recipes.length} recipes.`);
    await localDb.close();

    // 2. Connect to Remote DB and insert data
    console.log("\n📡 Connecting to PRODUCTION database...");
    const remoteDb = await mongoose.createConnection(remoteUri).asPromise();
    
    const RemoteCategory = remoteDb.model("Category", Category.schema);
    const RemoteRecipe = remoteDb.model("Recipe", Recipe.schema);
    const RemoteUser = remoteDb.model("User", User.schema);

    console.log("🗑️ Clearing existing production data...");
    await RemoteCategory.deleteMany({});
    await RemoteRecipe.deleteMany({});
    await RemoteUser.deleteMany({});

    console.log("📤 Uploading data to production...");
    if (users.length > 0) await RemoteUser.insertMany(users);
    if (categories.length > 0) await RemoteCategory.insertMany(categories);
    if (recipes.length > 0) await RemoteRecipe.insertMany(recipes);

    console.log("✅ Migration complete! Your Render URL will now show all your data.");
    await remoteDb.close();
    process.exit(0);

  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

migrate();
