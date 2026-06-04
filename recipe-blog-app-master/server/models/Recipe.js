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

  steps: [{
    type: String,
    trim: true,
  }],

  cookingTime: {
    type: Number,
    min: 1,
    default: null,
  },

  servings: {
    type: Number,
    min: 1,
    default: null,
  },

  difficulty: {
    type: String,
    enum: ["Easy", "Medium", "Hard"],
    default: "Easy",
  },

  category: {
    type: String,
    enum: ["Thai", "American", "Chinese", "Mexican", "Indian", "Spanish"],
    required: "This field is required!",
  },

  image: {
    type: String,
    default: "",
  },

  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],

  ratings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
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
}, { timestamps: true });

recipeSchema.virtual("averageRating").get(function () {
  if (!this.ratings || this.ratings.length === 0) {
    return 0;
  }

  const total = this.ratings.reduce((sum, rating) => sum + rating.value, 0);
  return total / this.ratings.length;
});

recipeSchema.set("toJSON", { virtuals: true });
recipeSchema.set("toObject", { virtuals: true });

recipeSchema.index({ name: "text", description: "text" });
// WILDCARD INDEXING
// recipeScheam.index({ "$**": "text" });

module.exports = mongoose.model("Recipe", recipeSchema);
