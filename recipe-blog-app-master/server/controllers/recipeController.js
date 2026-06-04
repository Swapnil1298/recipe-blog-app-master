require("../models/database");

const fs = require("fs");
const path = require("path");
const Category = require("../models/Category");
const Recipe = require("../models/Recipe");
const User = require("../models/User");
const { sendLikeNotification, sendCommentNotification, sendRecipeSubmissionNotification } = require("../utils/mailer");

function getUploadedRecipeImage(req) {
  if (!req.files || !req.files.image) {
    return null;
  }

  const imageFile = req.files.image;

  if (!imageFile.mimetype || !imageFile.mimetype.startsWith("image/")) {
    throw new Error("Please upload a valid image file.");
  }

  return imageFile;
}

async function saveRecipeImage(imageFile, recipeName) {
  const extension = path.extname(imageFile.name || "");
  const safeRecipeName = String(recipeName || "recipe")
    .replace(/[^a-z0-9]/gi, "-")
    .toLowerCase();
  const imageName = `${Date.now()}-${safeRecipeName}${extension}`;
  const uploadPath = path.join(__dirname, "../../public/uploads", imageName);

  await imageFile.mv(uploadPath);

  return imageName;
}

function deleteRecipeImageFile(imageName) {
  if (!imageName) {
    return;
  }

  const imagePath = path.join(__dirname, "../../public/uploads", imageName);
  if (fs.existsSync(imagePath)) {
    try {
      fs.unlinkSync(imagePath);
    } catch (err) {
      console.error("Error deleting image file:", err);
    }
  }
}

function normalizeList(value) {
  return []
    .concat(value || [])
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

function normalizePositiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.round(number) : null;
}

function getAverageRating(recipe) {
  if (!recipe.ratings || recipe.ratings.length === 0) {
    return 0;
  }

  const total = recipe.ratings.reduce((sum, rating) => sum + rating.value, 0);
  return total / recipe.ratings.length;
}

function sortByPopularity(recipes) {
  return recipes.sort((a, b) => {
    const bScore = ((b.likes && b.likes.length) || 0) * 2 + getAverageRating(b) + ((b.comments && b.comments.length) || 0);
    const aScore = ((a.likes && a.likes.length) || 0) * 2 + getAverageRating(a) + ((a.comments && a.comments.length) || 0);
    return bScore - aScore;
  });
}

/**
 * GET /
 * HOMEPAGE
 */

exports.homepage = async (req, res) => {
  try {
    const limitNumber = 5;
    const categories = await Category.find({}).limit(limitNumber);
    const latest = await Recipe.find({}).sort({ _id: -1 }).limit(limitNumber);
    const popular = sortByPopularity(await Recipe.find({})).slice(0, limitNumber);

    const thai = await Recipe.find({ category: "Thai" }).limit(limitNumber);
    const american = await Recipe.find({ category: "American" }).limit(
      limitNumber
    );
    const chinese = await Recipe.find({ category: "Chinese" }).limit(
      limitNumber
    );

    const food = { latest, popular, thai, american, chinese };

    res.render("index", { title: "Cooking Blog - Home", categories, food });
  } catch (error) {
    res.status(500).send({ message: error.message || "Error Occurred" });
  }
};

/**
 * GET /categories
 * CATEGORIES
 */

exports.exploreCategories = async (req, res) => {
  try {
    const limitNumber = 20;
    const categories = await Category.find({}).limit(limitNumber);

    res.render("categories", {
      title: "Cooking Blog - Categories",
      categories,
    });
  } catch (error) {
    res.status(500).send({ message: error.message || "Error Occurred" });
  }
};

/**
 * GET /categories/:id
 * Categories By Id
 */
exports.exploreCategoriesById = async (req, res) => {
  try {
    let categoryId = req.params.id;
    const limitNumber = 20;
    const categoryById = await Recipe.find({ category: categoryId }).limit(
      limitNumber
    );
    res.render("categories", {
      title: "Cooking Blog - Categoreis",
      categoryById,
    });
  } catch (error) {
    res.status(500).send({ message: error.message || "Error Occurred" });
  }
};

/**
 * GET /recipe/:id
 * Recipe
 */
exports.exploreRecipe = async (req, res) => {
  try {
    let recipeId = req.params.id;
    const recipe = await Recipe.findById(recipeId);
    const infoErrorsObj = req.flash("infoErrors");
    const infoSubmitObj = req.flash("infoSubmit");

    res.render("recipe", {
      title: "Cooking Blog - Recipe",
      recipe,
      infoErrorsObj,
      infoSubmitObj,
    });
  } catch (error) {
    res.status(500).send({ message: error.message || "Error Occurred" });
  }
};

/**
 * GET|POST /search
 * Search
 */
exports.searchRecipe = async (req, res) => {
  try {
    const searchTerm = String(req.body.searchTerm || req.query.searchTerm || "").trim();

    const recipes = searchTerm
      ? await Recipe.find({
          $text: { $search: searchTerm, $diacriticSensitive: true },
        })
      : [];

    res.render("search", {
      title: "Cooking Blog - Search",
      recipes,
      searchTerm,
    });
  } catch (error) {
    res.status(500).send({ message: error.message || "Error Occurred" });
  }
};

/**
 * GET /explore-latest
 * Explore latest recipes
 */
exports.exploreLatest = async (req, res) => {
  try {
    const limitNumber = 23;
    const recipes = await Recipe.find({}).sort({ _id: -1 }).limit(limitNumber);

    res.render("explore-latest", {
      title: "Cooking Blog - Explore Latest",
      recipes: recipes, // Pass 'recipes' instead of 'recipe'
    });
  } catch (error) {
    res.status(500).send({ message: error.message || "Error Occurred" });
  }
};

/**
 * GET /popular
 * Explore recipes with the most engagement
 */
exports.explorePopular = async (req, res) => {
  try {
    const recipes = sortByPopularity(await Recipe.find({})).slice(0, 30);

    res.render("explore-latest", {
      title: "Cooking Blog - Most Popular",
      pageHeading: "Most Popular Recipes",
      recipes,
    });
  } catch (error) {
    res.status(500).send({ message: error.message || "Error Occurred" });
  }
};

/**
 * GET /explore-random
 * Explore Random as JSON
 */
exports.exploreRandom = async (req, res) => {
  try {
    let count = await Recipe.countDocuments();
    let random = Math.floor(Math.random() * count);
    let recipe = await Recipe.findOne().skip(random).exec();

    res.render("explore-random", {
      title: "Cooking Blog - Explore Random",
      recipe,
    });
  } catch (error) {
    res.status(500).send({ message: error.message || "Error Occurred" });
  }
};

/**
 * GET /submit-recipe
 * Submit Recipe
 */
exports.submitRecipe = async (req, res) => {
  if (!req.session.userId) {
    req.flash("infoErrors", "You must be logged in to submit a recipe.");
    return res.redirect("/login");
  }
  const infoErrorsObj = req.flash("infoErrors");
  const infoSubmitObj = req.flash("infoSubmit");

  res.render("submit-recipe", {
    title: "Cooking Blog - Submit Recipe",
    infoSubmitObj,
    infoErrorsObj,
  });
};

/**
 * POST /submit-recipe
 * Submit Recipe
 */
exports.submitRecipeOnPost = async (req, res) => {
  try {
    if (!req.session.userId) {
      req.flash("infoErrors", "You must be logged in to submit a recipe.");
      return res.redirect("/login");
    }

    const imageUploadFile = getUploadedRecipeImage(req);
    const newImageName = imageUploadFile
      ? await saveRecipeImage(imageUploadFile, req.body.name)
      : "";

    const ingredients = normalizeList(req.body.ingredients);
    const steps = normalizeList(req.body.steps);

    if (ingredients.length === 0) {
      throw new Error("Please add at least one ingredient.");
    }

    const newRecipe = new Recipe({
      name: req.body.name,
      description: req.body.description,
      email: req.body.email,
      ingredients,
      steps,
      cookingTime: normalizePositiveNumber(req.body.cookingTime),
      servings: normalizePositiveNumber(req.body.servings),
      difficulty: ["Easy", "Medium", "Hard"].includes(req.body.difficulty)
        ? req.body.difficulty
        : "Easy",
      category: req.body.category,
      image: newImageName,
      user: req.session.userId,
    });

    await newRecipe.save();

    // ── Send submission confirmation email to the recipe author ──────────────
    try {
      const author = await User.findById(req.session.userId, "name email");
      if (author && author.email) {
        sendRecipeSubmissionNotification({
          ownerEmail: author.email,
          ownerName:  author.name,
          recipeName: newRecipe.name,
          recipeId:   newRecipe._id,
        }).catch((err) => console.error("Submission email error:", err.message));
      }
    } catch (mailErr) {
      console.error("Submission email lookup error:", mailErr.message);
    }

    if (newRecipe.image) {
      req.flash("infoSubmit", "Your recipe has been submitted successfully.");
    } else {
      req.flash("infoSubmit", "Your recipe has been submitted successfully. You can upload an image from the recipe page.");
    }

    res.redirect(`/recipe/${newRecipe._id}`);
  } catch (error) {
    req.flash("infoErrors", error.message);
    res.redirect("/submit-recipe");
  }
};

// upadte Query
// async function upadteRecipe() {
//   try {
//     const res = await Recipe.updateOne(
//       { name: "Grandma Specials" },
//       { name: "Mom Specials" }
//     );

//     res.n; //-> Number Of Documents Matched
//     res.nModified; //-> Number of documents modified
//   } catch (error) {
//     console.log(error);
//   }
// }
// upadteRecipe();

// delelte query
// async function deleteRecipe() {
//   try {
//     const res = await Recipe.deleteOne({ name: "Nice" });
//   } catch (error) {
//     console.log(error);
//   }
// }
// deleteRecipe();

/*
async function insertDummyCategoryData() {
  try {
    await Category.insertMany([
      {
        name: "Thai",
        image: "thai-food.jgp",
      },
      {
        name: "American",
        image: "american-food.jgp",
      },
      {
        name: "Chinese",
        image: "chinese-food.jgp",
      },
      {
        name: "Mexican",
        image: "mexican-food.jgp",
      },
      {
        name: "Indian",
        image: "indian-food.jgp",
      },
      {
        name: "Spanish",
        image: "spanish-food.jgp",
      },
    ]);
  } catch (error) {
    console.log(`err: ${error}`);
  }
}

insertDummyCategoryData();
*/

// dummy recipe data
/*
async function insertDymmyRecipeData() {
  try {
    await Recipe.insertMany([
      {
        name: "Crab cakes",
        description:
          "\n        Preheat the oven to 175ºC/gas 3. Lightly grease a 22cm metal or glass pie dish with a little of the butter.\n        For the pie crust, blend the biscuits, sugar and remaining butter in a food processor until the mixture resembles breadcrumbs.\n        Transfer to the pie dish and spread over the bottom and up the sides, firmly pressing down.\n        Bake for 10 minutes, or until lightly browned. Remove from oven and place the dish on a wire rack to cool.\n        For the filling, whisk the egg yolks in a bowl. Gradually whisk in the condensed milk until smooth.\n        Mix in 6 tablespoons of lime juice, then pour the filling into the pie crust and level over with the back of a spoon.\n        Return to the oven for 15 minutes, then place on a wire rack to cool.\n        Once cooled, refrigerate for 6 hours or overnight.\n        To serve, whip the cream until it just holds stiff peaks. Add dollops of cream to the top of the pie, and grate over some lime zest, for extra zing if you like.\n    \n        Source: https://www.jamieoliver.com/recipes/fruit-recipes/key-lime-pie/",
        email: "hello@email.com",
        ingredients: [
          "4 large free-range egg yolks",
          "400 ml condensed milk",
          "5 limes",
          "200 ml double cream",
        ],
        category: "American",
        image: "crab-cakes.jpg",
        __v: 0,
      },
      {
        name: "Thai-style mussels",
        description:
          "Wash the mussels thoroughly, discarding any that aren’t tightly closed.\n        Trim and finely slice the spring onions, peel and finely slice the garlic. Pick and set aside the coriander leaves, then finely chop the stalks. Cut the lemongrass into 4 pieces, then finely slice the chilli.\n        In a wide saucepan, heat a little groundnut oil and soften the spring onion, garlic, coriander stalks, lemongrass and most of the red chilli for around 5 minutes.\n        \n        Source: https://www.jamieoliver.com/recipes/seafood-recipes/thai-style-mussels/",
        email: "hello@email.com",
        ingredients: [
          "1 kg mussels , debearded, from sustainable sources",
          "groundnut oil",
          "4 spring onions",
          "2 cloves of garlic",
          "½ a bunch of fresh coriander",
        ],
        category: "Thai",
        image: "thai-style-mussels.jpg",
        __v: 0,
      },
      {
        name: "Thai-style mussels",
        description:
          "Peel and crush the garlic, then peel and roughly chop the ginger. Trim the greens, finely shredding the cabbage, if using. Trim and finely slice the spring onions and chilli. Pick the herbs.\n        Bash the lemongrass on a chopping board with a rolling pin until it breaks open, then add to a large saucepan along with the garlic, ginger and star anise.\n        Place the pan over a high heat, then pour in the vegetable stock. Bring it just to the boil, then turn down very low and gently simmer for 30 minutes.\n        Source: https://www.jamieoliver.com/recipes/vegetables-recipes/asian-vegetable-broth/",
        email: "hello@email.com",
        ingredients: [
          "3 cloves of garlic",
          "5cm piece of ginger",
          "200 g mixed Asian greens , such as baby pak choi, choy sum, Chinese cabbage",
          "2 spring onions",
          "1 fresh red chilli",
        ],
        category: "Thai",
        image: "thai-inspired-vegetable-broth.jpg",
        __v: 0,
      },
      {
        name: "Thai-Chinese-inspired pinch salad",
        description:
          "Peel and very finely chop the ginger and deseed and finely slice the chilli (deseed if you like). Toast the sesame seeds in a dry frying pan until lightly golden, then remove to a bowl.\n        Mix the prawns with the five-spice and ginger, finely grate in the lime zest and add a splash of sesame oil. Toss to coat, then leave to marinate.\n    \n        Source: https://www.jamieoliver.com/recipes/seafood-recipes/asian-pinch-salad/",
        email: "hello@email.com",
        ingredients: [
          "5 cm piece of ginger",
          "1 fresh red chilli",
          "25 g sesame seeds",
          "24 raw peeled king prawns , from sustainable sources (defrost first, if using frozen)",
          "1 pinch Chinese five-spice powder",
        ],
        category: "Chinese",
        image: "thai-chinese-inspired-pinch-salad.jpg",
        __v: 0,
      },
      {
        name: "Southern fried chicken",
        description:
          "\n        To make the brine, toast the peppercorns in a large pan on a high heat for 1 minute, then add the rest of the brine ingredients and 400ml of cold water. Bring to the boil, then leave to cool, topping up with another 400ml of cold water.\n    \n        Meanwhile, slash the chicken thighs a few times as deep as the bone, keeping the skin on for maximum flavour. Once the brine is cool, add all the chicken pieces, cover with clingfilm and leave in the fridge for at least 12 hours – I do this overnight.\n    \n        After brining, remove the chicken to a bowl, discarding the brine, then pour over the buttermilk, cover with clingfilm and place in the fridge for a further 8 hours, so the chicken is super-tender.\n    \n        When you’re ready to cook, preheat the oven to 190°C/375°F/gas 5.\n    \n        Wash the sweet potatoes well, roll them in a little sea salt, place on a tray and bake for 30 minutes.\n    \n        Meanwhile, make the pickle – toast the fennel seeds in a large pan for 1 minute, then remove from the heat. Pour in the vinegar, add the sugar and a good pinch of sea salt, then finely slice and add the cabbage. Place in the fridge, remembering to stir every now and then while you cook your chicken.\n    \n        Source: https://www.jamieoliver.com/recipes/chicken-recipes/southern-fried-chicken/",
        email: "hello@email.com",
        ingredients: [
          "4 free-range chicken thighs , skin on, bone in",
          "4 free-range chicken drumsticks",
          "200 ml buttermilk",
          "4 sweet potatoes",
          "200 g plain flour",
          "1 level teaspoon baking powder",
          "1 level teaspoon cayenne pepper",
          "1 level teaspoon hot smoked paprika",
        ],
        category: "American",
        image: "southern-friend-chicken.jpg",
        __v: 0,
      },
      {
        name: "Chocolate & banoffee whoopie pies",
        description:
          "\n        Preheat the oven to 170ºC/325ºF/gas 3 and line 2 baking sheets with greaseproof paper.\n        Combine the cocoa powder with a little warm water to form a paste, then add to a bowl with the remaining whoopie ingredients. Mix into a smooth, slightly stiff batter.\n        Spoon equal-sized blobs, 2cm apart, onto the baking sheets, then place in the hot oven for 8 minutes, or until risen and cooked through.\n        Cool for a couple of minutes on the sheets, then move to a wire rack to cool completely.\n        Once the whoopies are cool, spread ½ a teaspoon of dulce de leche on the flat sides.\n        Peel and slice the bananas, then top half the pies with 2 slices of the banana.\n        Sandwich together with the remaining halves, and dust with icing sugar and cocoa powder.\n    \n        Source: https://www.jamieoliver.com/recipes/chocolate-recipes/chocolate-amp-banoffee-whoopie-pies/",
        email: "hello@email.com",
        ingredients: [
          "3 spring onions",
          "½ a bunch of fresh flat-leaf parsley",
          "1 large free-range egg",
          "750 g cooked crabmeat , from sustainable sources",
          "300 g mashed potatoes",
          "1 teaspoon ground white pepper",
          "1 teaspoon cayenne pepper",
          "olive oil",
        ],
        category: "American",
        image: "chocolate-banoffe-whoopie-pies.jpg",
        __v: 0,
      },
      {
        name: "Veggie pad Thai",
        description:
          "\n        Cook the noodles according to the packet instructions, then drain and refresh under cold running water and toss with 1 teaspoon of sesame oil.\n        Lightly toast the peanuts in a large non-stick frying pan on a medium heat until golden, then bash in a pestle and mortar until fine, and tip into a bowl.\n        Peel the garlic and bash to a paste with the tofu, add 1 teaspoon of sesame oil, 1 tablespoon of soy, the tamarind paste and chilli sauce, then squeeze and muddle in half the lime juice.\n        Peel and finely slice the shallot, then place in the frying pan over a high heat. Trim, prep and slice the crunchy veg, as necessary, then dry-fry for 4 minutes, or until lightly charred (to bring out a nutty, slightly smoky flavour).\n    \n        Source: https://www.jamieoliver.com/recipes/vegetable-recipes/veggie-pad-thai/",
        email: "hello@email.com",
        ingredients: [
          "150 g rice noodles",
          "sesame oil",
          "2 cloves of garlic",
          "80 g silken tofu",
          "low-salt soy sauce",
        ],
        category: "Thai",
        image: "veggie-pad-thai.jpg",
        __v: 0,
      },
      {
        name: "Chinese steak & tofu stew",
        description:
          "Get your prep done first, for smooth cooking. Chop the steak into 1cm chunks, trimming away and discarding any fat.\n        Peel and finely chop the garlic and ginger and slice the chilli. Trim the spring onions, finely slice the top green halves and put aside, then chop the whites into 2cm chunks. Peel the carrots and mooli or radishes, and chop to a similar size.\n        Place a large pan on a medium-high heat and toast the Szechuan peppercorns while it heats up. Tip into a pestle and mortar, leaving the pan on the heat.\n        Place the chopped steak in the pan with 1 tablespoon of groundnut oil. Stir until starting to brown, then add the garlic, ginger, chilli, the white spring onions, carrots and mooli or radishes.\n    \n        Source: https://www.jamieoliver.com/recipes/stew-recipes/chinese-steak-tofu-stew/",
        email: "hello@email.com",
        ingredients: [
          "250g rump or sirloin steak",
          "2 cloves of garlic",
          "4cm piece of ginger",
          "2 fresh red chilli",
          "1 bunch of spring onions",
        ],
        category: "Chinese",
        image: "chinese-steak-tofu-stew.jpg",
        __v: 0,
      },
      {
        name: "Spring rolls",
        description:
          "Put your mushrooms in a medium-sized bowl, cover with hot water and leave for 10 minutes, or until soft. Meanwhile, place the noodles in a large bowl, cover with boiling water and leave for 1 minute. Drain, rinse under cold water, then set aside.\n        For the filling, finely slice the cabbage and peel and julienne the carrot. Add these to a large bowl with the noodles.\n    \n        Source: https://www.jamieoliver.com/recipes/vegetables-recipes/spring-rolls/",
        email: "hello@email.com",
        ingredients: [
          "40 g dried Asian mushrooms",
          "50 g vermicelli noodles",
          "200 g Chinese cabbage",
          "1 carrot",
          "3 spring onions",
        ],
        category: "Chinese",
        image: "spring-rolls.jpg",
        __v: 0,
      },
      {
        name: "Tom Daley's sweet & sour chicken",
        description:
          "Drain the juices from the tinned fruit into a bowl, add the soy and fish sauces, then whisk in 1 teaspoon of cornflour until smooth. Chop the pineapple and peaches into bite-sized chunks and put aside.\n        Pull off the chicken skin, lay it flat in a large, cold frying pan, place on a low heat and leave for a few minutes to render the fat, turning occasionally. Once golden, remove the crispy skin to a plate, adding a pinch of sea salt and five-spice.\n        Meanwhile, slice the chicken into 3cm chunks and place in a bowl with 1 heaped teaspoon of five-spice, a pinch of salt, 1 teaspoon of cornflour and half the lime juice. Peel, finely chop and add 1 clove of garlic, then toss to coat.\n    \n        Source: https://www.jamieoliver.com/recipes/chicken-recipes/tom-daley-s-sweet-sour-chicken/",
        email: "hello@email.com",
        ingredients: [
          "1 x 227 g tin of pineapple in natural juice",
          "1 x 213 g tin of peaches in natural juice",
          "1 tablespoon low-salt soy sauce",
          "1 tablespoon fish sauce",
          "2 teaspoons cornflour",
          "2 x 120 g free-range chicken breasts , skin on",
        ],
        category: "Chinese",
        image: "tom-daley.jpg",
        __v: 0,
      },
      {
        name: "Crab cakes",
        description:
          "\n        Trim and finely chop the spring onions, and pick and finely chop the parsley. Beat the egg.\n    \n        Combine the crabmeat, potatoes, spring onion, parsley, white pepper, cayenne and egg in a bowl with a little sea salt.\n    \n        Refrigerate for 30 minutes, then shape into 6cm cakes.\n    \n        Dust with flour and shallow-fry in oil over a medium heat for about 5 minutes each side or until golden-brown.\n    \n        Serve with pinches of watercress and a dollop of tartare sauce.\n    \n        Source: https://www.jamieoliver.com/recipes/seafood-recipes/crab-cakes/",
        email: "hello@email.com",
        ingredients: [
          "3 spring onions",
          "½ a bunch of fresh flat-leaf parsley",
          "1 large free-range egg",
          "750 g cooked crabmeat , from sustainable sources",
          "300 g mashed potatoes",
          "1 teaspoon ground white pepper",
          "1 teaspoon cayenne pepper",
          "olive oil",
        ],
        category: "American",
        image: "crab-cakes.jpg",
        __v: 0,
      },
      {
        name: "Thai red chicken soup",
        description:
          "\n        Sit the chicken in a large, deep pan.\n        Carefully halve the squash lengthways, then cut into 3cm chunks, discarding the seeds.\n        Slice the coriander stalks, add to the pan with the squash, curry paste and coconut milk, then pour in 1 litre of water. Cover and simmer on a medium heat for 1 hour 20 minutes.\n        Use tongs to remove the chicken to a platter. Spoon any fat from the surface of the soup over the chicken, then sprinkle with half the coriander leaves.\n        Serve with 2 forks for divvying up the meat at the table. Use a potato masher to crush some of the squash, giving your soup a thicker texture.\n    \n        Source: https://www.jamieoliver.com/recipes/chicken-recipes/thai-red-chicken-soup/",
        email: "hello@email.com",
        ingredients: [
          "1 x 1.6 kg whole free-range chicken",
          "1 butternut squash (1.2kg)",
          "1 bunch of fresh coriander (30g)",
        ],
        category: "Thai",
        image: "thai-red-chicken-soup.jpg",
        __v: 0,
      },
      {
        name: "Key lime pie",
        description:
          "\n        Preheat the oven to 175ºC/gas 3. Lightly grease a 22cm metal or glass pie dish with a little of the butter.\n        For the pie crust, blend the biscuits, sugar and remaining butter in a food processor until the mixture resembles breadcrumbs.\n        Transfer to the pie dish and spread over the bottom and up the sides, firmly pressing down.\n        Bake for 10 minutes, or until lightly browned. Remove from oven and place the dish on a wire rack to cool.\n        For the filling, whisk the egg yolks in a bowl. Gradually whisk in the condensed milk until smooth.\n        Mix in 6 tablespoons of lime juice, then pour the filling into the pie crust and level over with the back of a spoon.\n        Return to the oven for 15 minutes, then place on a wire rack to cool.\n        Once cooled, refrigerate for 6 hours or overnight.\n        To serve, whip the cream until it just holds stiff peaks. Add dollops of cream to the top of the pie, and grate over some lime zest, for extra zing if you like.\n    \n        Source: https://www.jamieoliver.com/recipes/fruit-recipes/key-lime-pie/",
        email: "hello@email.com",
        ingredients: [
          "4 large free-range egg yolks",
          "400 ml condensed milk",
          "5 limes",
          "200 ml double cream",
        ],
        category: "American",
        image: "key-lime-pie.jpg",
        __v: 0,
      },
      {
        name: "Grilled lobster rolls",
        description:
          "\n        Remove the butter from the fridge and allow to soften.\n        Preheat a griddle pan until really hot.\n        Butter the rolls on both sides and grill on both sides until toasted and lightly charred (keep an eye on them so they don’t burn).\n        Trim and dice the celery, chop the lobster meat and combine with the mayonnaise. Season with sea salt and black pepper to taste.\n        Open your warm grilled buns, shred and pile the lettuce inside each one and top with the lobster mixture. Serve immediately.\n    \n        Source: https://www.jamieoliver.com/recipes/fruit-recipes/key-lime-pie/",
        email: "hello@email.com",
        ingredients: [
          "85 g butter",
          "6 submarine rolls",
          "500 g cooked lobster meat, from sustainable sources",
          "1 stick of celery",
          "2 tablespoons mayonnaise , made using free-range eggs",
        ],
        category: "American",
        image: "grilled-lobster-rolls.jpg",
        __v: 0,
      },
      {
        name: "Thai green curry",
        description:
          "Preheat the oven to 180ºC/350ºF/gas 4.\n        Wash the squash, carefully cut it in half lengthways and remove the seeds, then cut into wedges. In a roasting tray, toss with 1 tablespoon of groundnut oil and a pinch of sea salt and black pepper, then roast for around 1 hour, or until tender and golden.\n        For the paste, toast the cumin seeds in a dry frying pan for 2 minutes, then tip into a food processor.\n        Peel, roughly chop and add the garlic, shallots and ginger, along with the kaffir lime leaves, 2 tablespoons of groundnut oil, the fish sauce, chillies (pull off the stalks), coconut and most of the coriander (stalks and all).\n        Bash the lemongrass, remove and discard the outer layer, then snap into the processor, squeeze in the lime juice and blitz into a paste, scraping down the sides halfway.\n        Put 1 tablespoon of groundnut oil into a large casserole pan on a medium heat with the curry paste and fry for 5 minutes to get the flavours going, stirring regularly.\n        Tip in the coconut milk and half a tin’s worth of water, then simmer and thicken on a low heat for 5 minutes.\n    \n        Source: https://www.jamieoliver.com/recipes/butternut-squash-recipes/thai-green-curry/",
        email: "hello@email.com",
        ingredients: [
          "1 butternut squash (1.2kg)",
          "groundnut oil",
          "12x 400 g tins of light coconut milk",
          "400 g leftover cooked greens, such as",
          "Brussels sprouts, Brussels tops, kale, cabbage, broccoli",
        ],
        category: "Thai",
        image: "thai-green-curry.jpg",
        __v: 0,
      },
      {
        name: "Stir-fried vegetables",
        description:
          "Crush the garlic and finely slice the chilli and spring onion. Peel and finely slice the red onion, and mix with the garlic, chilli and spring onion.\n        Shred the mangetout, slice the mushrooms and water chestnuts, and mix with the shredded cabbage in a separate bowl to the onion mixture.\n        Heat your wok until it’s really hot. Add a splash of oil – it should start to smoke – then the chilli and onion mix. Stir for just 2 seconds before adding the other mix. Flip and toss the vegetables in the wok if you can; if you can’t, don’t worry, just keep the vegetables moving with a wooden spoon, turning them over every few seconds so they all keep feeling the heat of the bottom of the wok. Season with sea salt and black pepper.\n    \n        Source: https://www.jamieoliver.com/recipes/vegetables-recipes/stir-fried-vegetables/",
        email: "hello@email.com",
        ingredients: [
          "1 clove of garlic",
          "1 fresh red chilli",
          "3 spring onions",
          "1 small red onion",
          "1 handful of mangetout",
          "a few shiitake mushrooms",
        ],
        category: "Chinese",
        image: "stir-fried-vegetables.jpg",
        __v: 0,
      },
      {
        name: "New Chocolate Cake",
        description: "Chocolate Cake Description...",
        email: "hello@email.com",
        ingredients: ["Water"],
        category: "Mexican",
        image: "chinese-steak-tofu-stew.jpg",
        __v: 0,
      },
    ]);
  } catch (error) {
    console.log("err", +error);
  }
}

insertDymmyRecipeData();
*/

/**
 * POST /recipe/:id/like
 * Toggle Like on Recipe
 */
exports.likeRecipe = async (req, res) => {
  try {
    if (!req.session.userId) {
      req.flash("infoErrors", "You must be logged in to like recipes.");
      return res.redirect(`/recipe/${req.params.id}`);
    }

    const recipeId = req.params.id;
    const userId = req.session.userId;

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).send("Recipe not found");
    }

    // Toggle like
    recipe.likes = recipe.likes || [];
    const index = recipe.likes.findIndex((likedUserId) => likedUserId.toString() === userId.toString());
    const isNewLike = index === -1;
    if (isNewLike) {
      recipe.likes.push(userId);
    } else {
      recipe.likes.splice(index, 1);
    }

    await recipe.save();

    // ── Send email notification to recipe owner (only on new like, not unlike) ──
    if (isNewLike && recipe.user && recipe.user.toString() !== userId.toString()) {
      try {
        const [liker, owner] = await Promise.all([
          User.findById(userId, "name"),
          User.findById(recipe.user, "name email"),
        ]);
        if (owner && owner.email) {
          sendLikeNotification({
            ownerEmail: owner.email,
            ownerName: owner.name,
            recipeName: recipe.name,
            recipeId: recipe._id,
            likerName: liker ? liker.name : "Someone",
          }).catch((err) => console.error("Like email error:", err.message));
        }
      } catch (mailErr) {
        console.error("Like email lookup error:", mailErr.message);
      }
    }

    res.redirect(`/recipe/${recipeId}`);
  } catch (error) {
    res.status(500).send({ message: error.message || "Error Occurred" });
  }
};

/**
 * POST /recipe/:id/save
 * Toggle Saved Recipe
 */
exports.saveRecipe = async (req, res) => {
  try {
    if (!req.session.userId) {
      req.flash("infoErrors", "You must be logged in to save recipes.");
      return res.redirect(`/recipe/${req.params.id}`);
    }

    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).send("Recipe not found");
    }

    const currentUser = await User.findById(req.session.userId);
    if (!currentUser) {
      return res.status(404).send("User not found");
    }

    const recipeIndex = (currentUser.savedRecipes || []).findIndex(
      (savedRecipeId) => savedRecipeId.toString() === recipe._id.toString()
    );

    if (recipeIndex === -1) {
      currentUser.savedRecipes.push(recipe._id);
      req.flash("infoSubmit", "Recipe saved to your profile.");
    } else {
      currentUser.savedRecipes.splice(recipeIndex, 1);
      req.flash("infoSubmit", "Recipe removed from your saved list.");
    }

    await currentUser.save();
    res.redirect(`/recipe/${recipe._id}`);
  } catch (error) {
    res.status(500).send({ message: error.message || "Error Occurred" });
  }
};

/**
 * POST /recipe/:id/rate
 * Create or update a user's rating
 */
exports.rateRecipe = async (req, res) => {
  try {
    if (!req.session.userId) {
      req.flash("infoErrors", "You must be logged in to rate recipes.");
      return res.redirect(`/recipe/${req.params.id}`);
    }

    const ratingValue = Number(req.body.rating);
    if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      req.flash("infoErrors", "Please choose a rating from 1 to 5 stars.");
      return res.redirect(`/recipe/${req.params.id}`);
    }

    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).send("Recipe not found");
    }

    recipe.ratings = recipe.ratings || [];
    const existingRating = recipe.ratings.find(
      (rating) => rating.user.toString() === req.session.userId.toString()
    );

    if (existingRating) {
      existingRating.value = ratingValue;
      existingRating.createdAt = new Date();
      req.flash("infoSubmit", "Your rating has been updated.");
    } else {
      recipe.ratings.push({
        user: req.session.userId,
        value: ratingValue,
      });
      req.flash("infoSubmit", "Thanks for rating this recipe.");
    }

    await recipe.save();
    res.redirect(`/recipe/${recipe._id}`);
  } catch (error) {
    res.status(500).send({ message: error.message || "Error Occurred" });
  }
};

/**
 * POST /recipe/:id/comment
 * Add Comment to Recipe
 */
exports.commentRecipe = async (req, res) => {
  try {
    if (!req.session.userId) {
      req.flash("infoErrors", "You must be logged in to comment.");
      return res.redirect(`/recipe/${req.params.id}`);
    }

    const recipeId = req.params.id;
    const userId = req.session.userId;
    const { comment } = req.body;

    if (!comment || comment.trim() === "") {
      req.flash("infoErrors", "Comment content cannot be empty.");
      return res.redirect(`/recipe/${recipeId}`);
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).send("Recipe not found");
    }

    recipe.comments.push({
      user: userId,
      userName: user.name,
      comment: comment.trim(),
    });

    await recipe.save();

    // ── Send email notification to recipe owner ──────────────────────────────
    if (recipe.user && recipe.user.toString() !== userId.toString()) {
      try {
        const owner = await User.findById(recipe.user, "name email");
        if (owner && owner.email) {
          sendCommentNotification({
            ownerEmail: owner.email,
            ownerName: owner.name,
            recipeName: recipe.name,
            recipeId: recipe._id,
            commenterName: user.name,
            commentText: comment.trim(),
          }).catch((err) => console.error("Comment email error:", err.message));
        }
      } catch (mailErr) {
        console.error("Comment email lookup error:", mailErr.message);
      }
    }

    res.redirect(`/recipe/${recipeId}`);
  } catch (error) {
    res.status(500).send({ message: error.message || "Error Occurred" });
  }
};

/**
 * POST /recipe/:id/image
 * Upload or replace recipe image after submission
 */
exports.uploadRecipeImage = async (req, res) => {
  try {
    if (!req.session.userId) {
      req.flash("infoErrors", "You must be logged in to upload a recipe image.");
      return res.redirect(`/recipe/${req.params.id}`);
    }

    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).send("Recipe not found");
    }

    const user = await User.findById(req.session.userId);
    const isOwner = recipe.user && recipe.user.toString() === req.session.userId.toString();
    const isAdmin = user && user.isAdmin;

    if (!isOwner && !isAdmin) {
      req.flash("infoErrors", "You are not authorized to upload an image for this recipe.");
      return res.redirect(`/recipe/${recipe._id}`);
    }

    const imageUploadFile = getUploadedRecipeImage(req);
    if (!imageUploadFile) {
      req.flash("infoErrors", "Please choose an image to upload.");
      return res.redirect(`/recipe/${recipe._id}`);
    }

    const oldImage = recipe.image;
    recipe.image = await saveRecipeImage(imageUploadFile, recipe.name);
    await recipe.save();
    deleteRecipeImageFile(oldImage);

    req.flash("infoSubmit", "Recipe image uploaded successfully.");
    res.redirect(`/recipe/${recipe._id}`);
  } catch (error) {
    req.flash("infoErrors", error.message);
    res.redirect(`/recipe/${req.params.id}`);
  }
};

/**
 * POST /recipe/:id/delete
 * Delete Recipe (Only by owner or admin)
 */
exports.deleteRecipe = async (req, res) => {
  try {
    if (!req.session.userId) {
      req.flash("infoErrors", "You must be logged in to delete a recipe.");
      return res.redirect(`/recipe/${req.params.id}`);
    }

    const recipeId = req.params.id;
    const recipe = await Recipe.findById(recipeId);

    if (!recipe) {
      return res.status(404).send("Recipe not found");
    }

    // Verify ownership or admin status
    const user = await User.findById(req.session.userId);
    const isOwner = recipe.user && recipe.user.toString() === req.session.userId.toString();
    const isAdmin = user && user.isAdmin;

    if (!isOwner && !isAdmin) {
      req.flash("infoErrors", "You are not authorized to delete this recipe.");
      return res.redirect(`/recipe/${recipeId}`);
    }

    deleteRecipeImageFile(recipe.image);

    // Delete the recipe
    await Recipe.findByIdAndDelete(recipeId);
    await User.updateMany(
      { savedRecipes: recipeId },
      { $pull: { savedRecipes: recipeId } }
    );

    req.flash("infoSubmit", "Recipe has been successfully deleted.");
    res.redirect("/");
  } catch (error) {
    res.status(500).send({ message: error.message || "Error Occurred" });
  }
};

/**
 * GET /users
 * Registered Users List Page
 */
exports.usersPage = async (req, res) => {
  try {
    const users = await User.find({}, "name email createdAt").sort({ createdAt: -1 });
    const infoErrorsObj = req.flash("infoErrors");
    const infoSubmitObj = req.flash("infoSubmit");

    res.render("users", {
      title: "Cooking Blog - Our Members",
      users,
      infoErrorsObj,
      infoSubmitObj,
    });
  } catch (error) {
    res.status(500).send({ message: error.message || "Error Occurred" });
  }
};

/**
 * GET /users/:id
 * Member Profile Page — shows user info + all their submitted recipes
 */
exports.getUserProfile = async (req, res) => {
  try {
    const memberId = req.params.id;
    const member = await User.findById(memberId, "name email createdAt");
    if (!member) {
      return res.status(404).send("Member not found");
    }
    const recipes = await Recipe.find({ user: memberId }).sort({ _id: -1 });
    const isOwnProfile = req.session.userId && req.session.userId.toString() === memberId.toString();
    const savedRecipes = isOwnProfile
      ? await User.findById(memberId)
          .populate("savedRecipes")
          .then((profileUser) => (profileUser.savedRecipes || []).filter(Boolean))
      : [];

    res.render("user-profile", {
      title: `Cooking Blog - ${member.name}'s Profile`,
      member,
      recipes,
      savedRecipes,
      isOwnProfile,
    });
  } catch (error) {
    res.status(500).send({ message: error.message || "Error Occurred" });
  }
};

/**
 * GET /about
 * About Page
 */
exports.aboutPage = async (req, res) => {
  res.render("about", { title: "Cooking Blog - About" });
};

/**
 * POST /recipe/:id/comment/:commentId/delete
 * Delete Comment (Only by Admin)
 */
exports.deleteComment = async (req, res) => {
  try {
    if (!req.session.userId) {
      req.flash("infoErrors", "You must be logged in to delete a comment.");
      return res.redirect(`/recipe/${req.params.id}`);
    }

    const user = await User.findById(req.session.userId);
    if (!user || !user.isAdmin) {
      req.flash("infoErrors", "You are not authorized to delete comments.");
      return res.redirect(`/recipe/${req.params.id}`);
    }

    const recipeId = req.params.id;
    const commentId = req.params.commentId;

    await Recipe.findByIdAndUpdate(recipeId, {
      $pull: { comments: { _id: commentId } }
    });

    req.flash("infoSubmit", "Comment has been successfully deleted.");
    res.redirect(`/recipe/${recipeId}`);
  } catch (error) {
    res.status(500).send({ message: error.message || "Error Occurred" });
  }
};

/**
 * GET /admin
 * Admin Dashboard Page
 */
exports.adminDashboard = async (req, res) => {
  try {
    if (!req.session.userId) {
      req.flash("infoErrors", "You must be logged in to view the admin dashboard.");
      return res.redirect("/login");
    }

    const user = await User.findById(req.session.userId);
    if (!user || !user.isAdmin) {
      req.flash("infoErrors", "Access Denied. Admins only.");
      return res.redirect("/");
    }

    const users = await User.find({}, "name email createdAt isAdmin").sort({ createdAt: -1 });
    const recipes = await Recipe.find({}, "name category user createdAt likes comments ratings difficulty cookingTime servings")
      .populate("user", "name email")
      .sort({ _id: -1 });
    const mostPopularRecipe = sortByPopularity([...recipes])[0] || null;
    const totalLikes = recipes.reduce((sum, recipe) => sum + ((recipe.likes && recipe.likes.length) || 0), 0);
    const totalComments = recipes.reduce((sum, recipe) => sum + ((recipe.comments && recipe.comments.length) || 0), 0);
    const totalRatings = recipes.reduce((sum, recipe) => sum + ((recipe.ratings && recipe.ratings.length) || 0), 0);

    const infoErrorsObj = req.flash("infoErrors");
    const infoSubmitObj = req.flash("infoSubmit");

    res.render("admin-dashboard", {
      title: "Cooking Blog - Admin Dashboard",
      users,
      recipes,
      stats: {
        totalUsers: users.length,
        totalRecipes: recipes.length,
        totalLikes,
        totalComments,
        totalRatings,
        mostPopularRecipe,
      },
      infoErrorsObj,
      infoSubmitObj,
    });
  } catch (error) {
    res.status(500).send({ message: error.message || "Error Occurred" });
  }
};
