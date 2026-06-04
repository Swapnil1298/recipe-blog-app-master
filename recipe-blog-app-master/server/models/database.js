const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const db = mongoose.connection;
let connectionPromise;

function getHelpfulMongoError(err) {
  if (!process.env.MONGO_URI) {
    return "MONGO_URI is missing. Add it to your .env file or hosting environment variables.";
  }

  if (err.message && err.message.toLowerCase().includes("bad auth")) {
    return [
      "MongoDB authentication failed.",
      "Check the username and password in MONGO_URI.",
      "If your password contains special characters like @, #, %, /, or :, URL-encode the password before putting it in the connection string.",
    ].join(" ");
  }

  return `MongoDB connection error: ${err.message}`;
}

async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!process.env.MONGO_URI) {
    throw new Error(getHelpfulMongoError(new Error("MONGO_URI is missing")));
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      })
      .then(() => {
        console.log("Connected to DB...");
        return mongoose.connection;
      })
      .catch((err) => {
        connectionPromise = null;
        throw new Error(getHelpfulMongoError(err));
      });
  }

  return connectionPromise;
}

db.on("error", (err) => {
  console.error("MongoDB connection error:", err.message);
});

//Models
require("./Category");
require("./Recipe");
require("./User");

module.exports = connectDatabase;
