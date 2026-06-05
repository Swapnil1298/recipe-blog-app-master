const express = require("express");
const router = express.Router();

const recipeController = require("../controllers/recipeController");
const authController = require("../controllers/authController");
const seedController = require("../controllers/seedController");

function requireLogin(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }

  req.flash("infoErrors", "Please log in or sign up to view member details.");
  return res.redirect("/login");
}

/**
 * App Routes
 */
router.get("/", recipeController.homepage);
router.get("/recipe/:id", recipeController.exploreRecipe);
router.get("/categories", recipeController.exploreCategories);
router.get("/categories/:id", recipeController.exploreCategoriesById);
router.get("/search", recipeController.searchRecipe);
router.post("/search", recipeController.searchRecipe);
router.get("/explore-latest", recipeController.exploreLatest);
router.get("/popular", recipeController.explorePopular);
router.get("/explore-random", recipeController.exploreRandom);
router.get("/submit-recipe", recipeController.submitRecipe);
router.post("/submit-recipe", recipeController.submitRecipeOnPost);
router.get("/about", recipeController.aboutPage);
router.get("/users", requireLogin, recipeController.usersPage);
router.get("/users/:id", requireLogin, recipeController.getUserProfile);

// Interactions
router.post("/recipe/:id/like", recipeController.likeRecipe);
router.post("/recipe/:id/save", recipeController.saveRecipe);
router.post("/recipe/:id/rate", recipeController.rateRecipe);
router.post("/recipe/:id/comment", recipeController.commentRecipe);
router.get("/recipe/:id/image", recipeController.recipeImage);
router.post("/recipe/:id/image", recipeController.uploadRecipeImage);
router.post("/recipe/:id/delete", recipeController.deleteRecipe);

// Admin Routes
router.get("/admin", recipeController.adminDashboard);
router.post("/recipe/:id/comment/:commentId/delete", recipeController.deleteComment);

// Seed Route (one-time setup, protected by secret key)
router.get("/seed-database/:key", seedController.seedDatabase);

// Auth Routes
router.get("/register", authController.getRegister);
router.post("/register", authController.postRegister);
router.get("/login", authController.getLogin);
router.post("/login", authController.postLogin);
router.get("/logout", authController.logout);

module.exports = router;
