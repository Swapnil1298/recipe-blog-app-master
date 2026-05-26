const mongoose = require("mongoose");

const recipeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: "This field is required!",
  },

  description: {
    type: String,
    required: "This field is required!",
  },

  email: {
    type: String,
    required: "This field is required!",
  },

  ingredients: {
    type: Array,
    required: "This field is required!",
  },

  category: {
    type: String,
    enum: ["Thai", "American", "Chinese", "Mexican", "Indian", "Spanish"],
    required: "This field is required!",
  },

  image: {
    type: String,
    required: "This field is required!",
  },

  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],

  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    comment: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
});

recipeSchema.index({ name: "text", description: "text" });
// WILDCARD INDEXING
// recipeScheam.index({ "$**": "text" });

module.exports = mongoose.model("Recipe", recipeSchema);
