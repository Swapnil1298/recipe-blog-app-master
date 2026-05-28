const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 10000, // Timeout after 10s if can't connect
  socketTimeoutMS: 45000,          // Close sockets after 45s of inactivity
}).catch((err) => {
  console.error("MongoDB connection error:", err.message);
  process.exit(1); // Exit so Render knows the app failed to start
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", function () {
  console.log("Connected to DB...");
});

//Models
require("./Category");
require("./Recipe");
require("./User");

