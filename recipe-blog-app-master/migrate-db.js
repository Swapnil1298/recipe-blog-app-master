/**
 * migrate-db.js
 * 
 * This script copies your local database to your production database.
 * It uses direct host addresses to bypass ISP DNS blocks on mongodb+srv:// URIs.
 * 
 * Usage:
 *   node migrate-db.js
 */

const mongoose = require("mongoose");
const dns = require("dns");
const { promisify } = require("util");
const Category = require("./server/models/Category");
const Recipe = require("./server/models/Recipe");
const User = require("./server/models/User");

const resolveSrv = promisify(dns.resolveSrv);
const resolveTxt = promisify(dns.resolveTxt);

// ─── YOUR PRODUCTION CREDENTIALS ──────────────────────────────────────────────
const ATLAS_USER = "swapnilurmaliya79";
const ATLAS_PASS = "Swapnil1248";
const ATLAS_HOST = "cluster0.lvqawpf.mongodb.net";
const DB_NAME = "recipe_blog";
// ──────────────────────────────────────────────────────────────────────────────

async function buildDirectUri() {
  console.log("🔍 Resolving Atlas cluster hosts directly (bypassing SRV)...");
  
  // Known direct hosts from DNS resolution (pre-resolved to avoid ISP blocks)
  const directHosts = [
    "ac-bstrrkw-shard-00-00.lvqawpf.mongodb.net:27017",
    "ac-bstrrkw-shard-00-01.lvqawpf.mongodb.net:27017",
    "ac-bstrrkw-shard-00-02.lvqawpf.mongodb.net:27017"
  ];

  try {
    // Try to resolve SRV dynamically first
    const srvRecords = await resolveSrv(`_mongodb._tcp.${ATLAS_HOST}`);
    if (srvRecords && srvRecords.length > 0) {
      const hosts = srvRecords.map(r => `${r.name}:${r.port}`).join(",");
      console.log("✅ SRV resolved dynamically.");
      return `mongodb://${ATLAS_USER}:${encodeURIComponent(ATLAS_PASS)}@${hosts}/${DB_NAME}?ssl=true&replicaSet=atlas-bstrrkw-shard-0&authSource=admin&retryWrites=true&w=majority`;
    }
  } catch (e) {
    console.log("⚠️  SRV lookup blocked by ISP. Using pre-resolved direct hosts...");
  }

  // Fallback to pre-resolved direct hosts
  const hosts = directHosts.join(",");
  return `mongodb://${ATLAS_USER}:${encodeURIComponent(ATLAS_PASS)}@${hosts}/${DB_NAME}?ssl=true&replicaSet=atlas-bstrrkw-shard-0&authSource=admin&retryWrites=true&w=majority`;
}

async function migrate() {
  const localUri = "mongodb://localhost:27017/recipe_blog";

  try {
    // 1. Connect to Local DB and fetch all data
    console.log("\n📡 Connecting to LOCAL database...");
    const localDb = await mongoose.createConnection(localUri).asPromise();
    
    const LocalCategory = localDb.model("Category", Category.schema);
    const LocalRecipe = localDb.model("Recipe", Recipe.schema);
    const LocalUser = localDb.model("User", User.schema);

    console.log("📥 Fetching local data...");
    const categories = await LocalCategory.find({}).lean();
    const recipes = await LocalRecipe.find({}).lean();
    const users = await LocalUser.find({}).lean();

    console.log(`✅ Found: ${users.length} users, ${categories.length} categories, ${recipes.length} recipes.`);
    await localDb.close();

    // 2. Build the direct connection URI
    const remoteUri = await buildDirectUri();

    // 3. Connect to Remote DB and insert data
    console.log("\n📡 Connecting to PRODUCTION database (this may take ~30 seconds)...");
    console.log("⚠️  Make sure your IP is whitelisted in MongoDB Atlas Network Access!");
    
    const remoteDb = await mongoose.createConnection(remoteUri, {
      serverSelectionTimeoutMS: 60000,
      connectTimeoutMS: 60000,
    }).asPromise();
    
    const RemoteCategory = remoteDb.model("Category", Category.schema);
    const RemoteRecipe = remoteDb.model("Recipe", Recipe.schema);
    const RemoteUser = remoteDb.model("User", User.schema);

    console.log("🗑️  Clearing existing production data...");
    await RemoteCategory.deleteMany({});
    await RemoteRecipe.deleteMany({});
    await RemoteUser.deleteMany({});

    console.log("📤 Uploading data to production...");
    if (users.length > 0) await RemoteUser.insertMany(users);
    if (categories.length > 0) await RemoteCategory.insertMany(categories);
    if (recipes.length > 0) await RemoteRecipe.insertMany(recipes);

    console.log("\n✅ Migration complete! Refresh your Render URL to see all your data.");
    await remoteDb.close();
    process.exit(0);

  } catch (error) {
    if (error.name === "MongooseServerSelectionError") {
      console.error("\n❌ Could not connect to production database!");
      console.error("👉 Please whitelist your IP in MongoDB Atlas:");
      console.error("   1. Go to https://cloud.mongodb.com");
      console.error("   2. Click 'Network Access' in the left sidebar");
      console.error('   3. Click "+ Add IP Address"');
      console.error('   4. Click "Allow Access From Anywhere" (adds 0.0.0.0/0)');
      console.error("   5. Click Confirm, wait 60 seconds, then run this script again.");
    } else {
      console.error("❌ Migration failed:", error.message);
    }
    process.exit(1);
  }
}

migrate();
