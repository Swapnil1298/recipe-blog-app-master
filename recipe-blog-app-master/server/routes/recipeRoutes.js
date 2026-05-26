const express = require("express");
const router = express.Router();

const recipeController = require("../controllers/recipeController");
const authController = require("../controllers/authController");

/**
 * App Routes
 */
router.get("/", recipeController.homepage);
router.get("/recipe/:id", recipeController.exploreRecipe);
router.get("/categories", recipeController.exploreCategories);
router.get("/categories/:id", recipeController.exploreCategoriesById);
router.post("/search", recipeController.searchRecipe);
router.get("/explore-latest", recipeController.exploreLatest);
router.get("/explore-random", recipeController.exploreRandom);
router.get("/submit-recipe", recipeController.submitRecipe);
router.post("/submit-recipe", recipeController.submitRecipeOnPost);
router.get("/about", recipeController.aboutPage);

// Interactions
router.post("/recipe/:id/like", recipeController.likeRecipe);
router.post("/recipe/:id/comment", recipeController.commentRecipe);
router.post("/recipe/:id/delete", recipeController.deleteRecipe);

// Auth Routes
router.get("/register", authController.getRegister);
router.post("/register", authController.postRegister);
router.get("/login", authController.getLogin);
router.post("/login", authController.postLogin);
router.get("/logout", authController.logout);

module.exports = router;
