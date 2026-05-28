const mongoose = require("mongoose");
require("./server/models/database");
const Recipe = require("./server/models/Recipe");
const User = require("./server/models/User");

async function check() {
  try {
    const recipes = await Recipe.find({});
    console.log("Total recipes:", recipes.length);
    let withUserCount = 0;
    for (let r of recipes) {
      if (r.user) {
        withUserCount++;
        const user = await User.findById(r.user);
        console.log(`Recipe: "${r.name}" | User ID: ${r.user} | User Found: ${user ? user.name : "NO"} | Recipe Email: ${r.email}`);
      }
    }
    console.log("Recipes with user field:", withUserCount);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    mongoose.connection.close();
  }
}

check();
