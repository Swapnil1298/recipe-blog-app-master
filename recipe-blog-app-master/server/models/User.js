const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: "This field is required!",
  },
  email: {
    type: String,
    required: "This field is required!",
    unique: true,
  },
  password: {
    type: String,
    required: "This field is required!",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  savedRecipes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Recipe",
  }],
});

module.exports = mongoose.model("User", userSchema);
