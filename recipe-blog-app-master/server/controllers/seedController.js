/**
 * seedController.js
 *
 * A one-time route to seed the production database with categories and recipes.
 * Access it by visiting: https://your-render-url.com/seed-database/SWAPNIL_SEED_2024
 *
 * This runs FROM the Render server so it bypasses all local network/ISP restrictions.
 */

const Category = require("../models/Category");
const Recipe = require("../models/Recipe");

const SECRET_KEY = "SWAPNIL_SEED_2024";

const categories = [
  { name: "Thai", image: "thai-food.jpg" },
  { name: "American", image: "american-food.jpg" },
  { name: "Chinese", image: "chinese-food.jpg" },
  { name: "Mexican", image: "mexican-food.jpg" },
  { name: "Indian", image: "indian-food.jpg" },
  { name: "Spanish", image: "spanish-food.jpg" },
];

const recipes = [
  {
    name: "Crab cakes",
    description: `Preheat the oven to 175ºC/gas 3. Lightly grease a 22cm metal or glass pie dish with a little of the butter.\nFor the pie crust, blend the biscuits, sugar and remaining butter in a food processor until the mixture resembles breadcrumbs.\nTransfer to the pie dish and spread over the bottom and up the sides, firmly pressing down.\nBake for 10 minutes, or until lightly browned. Remove from oven and place the dish on a wire rack to cool.\nFor the filling, whisk the egg yolks in a bowl. Gradually whisk in the condensed milk until smooth.\nMix in 6 tablespoons of lime juice, then pour the filling into the pie crust and level over with the back of a spoon.\nReturn to the oven for 15 minutes, then place on a wire rack to cool.\nOnce cooled, refrigerate for 6 hours or overnight.\nTo serve, whip the cream until it just holds stiff peaks. Add dollops of cream to the top of the pie, and grate over some lime zest.\n\nSource: https://www.jamieoliver.com/recipes/fruit-recipes/key-lime-pie/`,
    email: "hello@email.com",
    ingredients: ["4 large free-range egg yolks", "400 ml condensed milk", "5 limes", "200 ml double cream"],
    category: "American",
    image: "crab-cakes.jpg",
  },
  {
    name: "Thai-style mussels",
    description: `Wash the mussels thoroughly, discarding any that aren't tightly closed.\nTrim and finely slice the spring onions, peel and finely slice the garlic. Pick and set aside the coriander leaves, then finely chop the stalks. Cut the lemongrass into 4 pieces, then finely slice the chilli.\nIn a wide saucepan, heat a little groundnut oil and soften the spring onion, garlic, coriander stalks, lemongrass and most of the red chilli for around 5 minutes.\n\nSource: https://www.jamieoliver.com/recipes/seafood-recipes/thai-style-mussels/`,
    email: "hello@email.com",
    ingredients: ["1 kg mussels , debearded, from sustainable sources", "groundnut oil", "4 spring onions", "2 cloves of garlic", "½ a bunch of fresh coriander"],
    category: "Thai",
    image: "thai-style-mussels.jpg",
  },
  {
    name: "Thai-inspired vegetable broth",
    description: `Peel and crush the garlic, then peel and roughly chop the ginger. Trim the greens, finely shredding the cabbage, if using. Trim and finely slice the spring onions and chilli. Pick the herbs.\nBash the lemongrass on a chopping board with a rolling pin until it breaks open, then add to a large saucepan along with the garlic, ginger and star anise.\nPlace the pan over a high heat, then pour in the vegetable stock. Bring it just to the boil, then turn down very low and gently simmer for 30 minutes.\nSource: https://www.jamieoliver.com/recipes/vegetables-recipes/asian-vegetable-broth/`,
    email: "hello@email.com",
    ingredients: ["3 cloves of garlic", "5cm piece of ginger", "200 g mixed Asian greens , such as baby pak choi, choy sum, Chinese cabbage", "2 spring onions", "1 fresh red chilli"],
    category: "Thai",
    image: "thai-inspired-vegetable-broth.jpg",
  },
  {
    name: "Thai-Chinese-inspired pinch salad",
    description: `Peel and very finely chop the ginger and deseed and finely slice the chilli. Toast the sesame seeds in a dry frying pan until lightly golden, then remove to a bowl.\nMix the prawns with the five-spice and ginger, finely grate in the lime zest and add a splash of sesame oil. Toss to coat, then leave to marinate.\n\nSource: https://www.jamieoliver.com/recipes/seafood-recipes/asian-pinch-salad/`,
    email: "hello@email.com",
    ingredients: ["5 cm piece of ginger", "1 fresh red chilli", "25 g sesame seeds", "24 raw peeled king prawns , from sustainable sources", "1 pinch Chinese five-spice powder"],
    category: "Chinese",
    image: "thai-chinese-inspired-pinch-salad.jpg",
  },
  {
    name: "Southern fried chicken",
    description: `To make the brine, toast the peppercorns in a large pan on a high heat for 1 minute, then add the rest of the brine ingredients and 400ml of cold water. Bring to the boil, then leave to cool.\nMeanwhile, slash the chicken thighs a few times as deep as the bone, keeping the skin on for maximum flavour. Once the brine is cool, add all the chicken pieces, cover with clingfilm and leave in the fridge for at least 12 hours.\n\nSource: https://www.jamieoliver.com/recipes/chicken-recipes/southern-fried-chicken/`,
    email: "hello@email.com",
    ingredients: ["4 free-range chicken thighs , skin on, bone in", "4 free-range chicken drumsticks", "200 ml buttermilk", "4 sweet potatoes", "200 g plain flour"],
    category: "American",
    image: "southern-friend-chicken.jpg",
  },
  {
    name: "Chocolate & banoffee whoopie pies",
    description: `Preheat the oven to 170ºC/325ºF/gas 3 and line 2 baking sheets with greaseproof paper.\nCombine the cocoa powder with a little warm water to form a paste, then add to a bowl with the remaining whoopie ingredients. Mix into a smooth, slightly stiff batter.\nSpoon equal-sized blobs, 2cm apart, onto the baking sheets, then place in the hot oven for 8 minutes, or until risen and cooked through.\n\nSource: https://www.jamieoliver.com/recipes/chocolate-recipes/chocolate-amp-banoffee-whoopie-pies/`,
    email: "hello@email.com",
    ingredients: ["3 spring onions", "½ a bunch of fresh flat-leaf parsley", "1 large free-range egg", "750 g cooked crabmeat , from sustainable sources", "300 g mashed potatoes"],
    category: "American",
    image: "chocolate-banoffe-whoopie-pies.jpg",
  },
  {
    name: "Veggie pad Thai",
    description: `Cook the noodles according to the packet instructions, then drain and refresh under cold running water and toss with 1 teaspoon of sesame oil.\nLightly toast the peanuts in a large non-stick frying pan on a medium heat until golden, then bash in a pestle and mortar until fine, and tip into a bowl.\n\nSource: https://www.jamieoliver.com/recipes/vegetable-recipes/veggie-pad-thai/`,
    email: "hello@email.com",
    ingredients: ["150 g rice noodles", "sesame oil", "2 cloves of garlic", "80 g silken tofu", "low-salt soy sauce"],
    category: "Thai",
    image: "veggie-pad-thai.jpg",
  },
  {
    name: "Chinese steak & tofu stew",
    description: `Get your prep done first, for smooth cooking. Chop the steak into 1cm chunks, trimming away and discarding any fat.\nPeel and finely chop the garlic and ginger and slice the chilli. Trim the spring onions, finely slice the top green halves and put aside, then chop the whites into 2cm chunks.\n\nSource: https://www.jamieoliver.com/recipes/stew-recipes/chinese-steak-tofu-stew/`,
    email: "hello@email.com",
    ingredients: ["250g rump or sirloin steak", "2 cloves of garlic", "4cm piece of ginger", "2 fresh red chilli", "1 bunch of spring onions"],
    category: "Chinese",
    image: "chinese-steak-tofu-stew.jpg",
  },
  {
    name: "Spring rolls",
    description: `Put your mushrooms in a medium-sized bowl, cover with hot water and leave for 10 minutes, or until soft. Meanwhile, place the noodles in a large bowl, cover with boiling water and leave for 1 minute. Drain, rinse under cold water, then set aside.\n\nSource: https://www.jamieoliver.com/recipes/vegetables-recipes/spring-rolls/`,
    email: "hello@email.com",
    ingredients: ["40 g dried Asian mushrooms", "50 g vermicelli noodles", "200 g Chinese cabbage", "1 carrot", "3 spring onions"],
    category: "Chinese",
    image: "spring-rolls.jpg",
  },
  {
    name: "Tom Daley's sweet & sour chicken",
    description: `Drain the juices from the tinned fruit into a bowl, add the soy and fish sauces, then whisk in 1 teaspoon of cornflour until smooth. Chop the pineapple and peaches into bite-sized chunks and put aside.\n\nSource: https://www.jamieoliver.com/recipes/chicken-recipes/tom-daley-s-sweet-sour-chicken/`,
    email: "hello@email.com",
    ingredients: ["1 x 227 g tin of pineapple in natural juice", "1 x 213 g tin of peaches in natural juice", "1 tablespoon low-salt soy sauce", "1 tablespoon fish sauce", "2 x 120 g free-range chicken breasts , skin on"],
    category: "Chinese",
    image: "tom-daley.jpg",
  },
  {
    name: "Thai red chicken soup",
    description: `Sit the chicken in a large, deep pan.\nCarefully halve the squash lengthways, then cut into 3cm chunks, discarding the seeds.\nSlice the coriander stalks, add to the pan with the squash, curry paste and coconut milk, then pour in 1 litre of water. Cover and simmer on a medium heat for 1 hour 20 minutes.\n\nSource: https://www.jamieoliver.com/recipes/chicken-recipes/thai-red-chicken-soup/`,
    email: "hello@email.com",
    ingredients: ["1 x 1.6 kg whole free-range chicken", "1 butternut squash (1.2kg)", "1 bunch of fresh coriander (30g)"],
    category: "Thai",
    image: "thai-red-chicken-soup.jpg",
  },
  {
    name: "Key lime pie",
    description: `Preheat the oven to 175ºC/gas 3. Lightly grease a 22cm metal or glass pie dish with a little of the butter.\nFor the filling, whisk the egg yolks in a bowl. Gradually whisk in the condensed milk until smooth.\nMix in 6 tablespoons of lime juice, then pour the filling into the pie crust.\n\nSource: https://www.jamieoliver.com/recipes/fruit-recipes/key-lime-pie/`,
    email: "hello@email.com",
    ingredients: ["4 large free-range egg yolks", "400 ml condensed milk", "5 limes", "200 ml double cream"],
    category: "American",
    image: "key-lime-pie.jpg",
  },
  {
    name: "Grilled lobster rolls",
    description: `Remove the butter from the fridge and allow to soften.\nPreheat a griddle pan until really hot.\nButter the rolls on both sides and grill on both sides until toasted and lightly charred.\n\nSource: https://www.jamieoliver.com/recipes/fruit-recipes/key-lime-pie/`,
    email: "hello@email.com",
    ingredients: ["85 g butter", "6 submarine rolls", "500 g cooked lobster meat, from sustainable sources", "1 stick of celery", "2 tablespoons mayonnaise"],
    category: "American",
    image: "grilled-lobster-rolls.jpg",
  },
  {
    name: "Thai green curry",
    description: `Preheat the oven to 180ºC/350ºF/gas 4.\nWash the squash, carefully cut it in half lengthways and remove the seeds, then cut into wedges.\nFor the paste, toast the cumin seeds in a dry frying pan for 2 minutes, then tip into a food processor.\n\nSource: https://www.jamieoliver.com/recipes/butternut-squash-recipes/thai-green-curry/`,
    email: "hello@email.com",
    ingredients: ["1 butternut squash (1.2kg)", "groundnut oil", "12x 400 g tins of light coconut milk", "400 g leftover cooked greens"],
    category: "Thai",
    image: "thai-green-curry.jpg",
  },
  {
    name: "Stir-fried vegetables",
    description: `Crush the garlic and finely slice the chilli and spring onion. Peel and finely slice the red onion, and mix with the garlic, chilli and spring onion.\nShred the mangetout, slice the mushrooms and water chestnuts, and mix with the shredded cabbage.\n\nSource: https://www.jamieoliver.com/recipes/vegetables-recipes/stir-fried-vegetables/`,
    email: "hello@email.com",
    ingredients: ["1 clove of garlic", "1 fresh red chilli", "3 spring onions", "1 small red onion", "1 handful of mangetout"],
    category: "Chinese",
    image: "stir-fried-vegetables.jpg",
  },
  {
    name: "Butter Chicken (Murgh Makhani)",
    description: `A classic Indian dish where tender chicken chunks are cooked in a creamy, spice-infused tomato gravy. Slowly simmered with butter and heavy cream, it has a rich texture and mild sweet-savory flavor. Serve with warm garlic naan or fluffy basmati rice for a comforting meal.`,
    email: "hello@email.com",
    ingredients: ["800g boneless chicken thighs", "1 cup plain yogurt", "2 tbsp lemon juice", "2 tbsp garam masala", "1 cup tomato puree", "1 cup heavy cream", "100g butter", "Fresh coriander for garnish"],
    category: "Indian",
    image: "butter-chicken.png",
  },
  {
    name: "Classic Masala Dosa",
    description: `A fermented crepe made from rice batter and black lentils, stuffed with a delicious, spiced potato mash. Crispy on the outside and soft on the inside, traditionally served hot with fresh coconut chutney and savory sambar broth.`,
    email: "hello@email.com",
    ingredients: ["2 cups parboiled rice", "1/2 cup urad dal (black lentils)", "1 tsp fenugreek seeds", "4 large boiled potatoes", "1 medium onion, sliced", "Curry leaves", "Green chilies"],
    category: "Indian",
    image: "masala-dosa.png",
  },
  {
    name: "Seafood Paella",
    description: `An authentic Spanish saffron rice dish loaded with shrimp, mussels, clams, and squid. Slowly cooked in a wide paella pan to achieve a beautiful caramelized rice bottom known as socarrat. Perfect for gatherings and celebrations.`,
    email: "hello@email.com",
    ingredients: ["2 cups Bomba rice", "4 cups seafood stock", "1 pinch saffron threads", "200g large shrimp", "200g mussels, cleaned", "150g squid, sliced", "Lemon wedges for serving"],
    category: "Spanish",
    image: "seafood-paella.png",
  },
  {
    name: "Spanish Tortilla (Tortilla de Patatas)",
    description: `The iconic Spanish omelette made with thinly sliced potatoes and onions slowly cooked in olive oil before being mixed with beaten eggs and pan-fried to a soft, custardy perfection. Can be served warm or at room temperature.`,
    email: "hello@email.com",
    ingredients: ["6 large eggs", "4 large potatoes", "1 medium yellow onion", "1 cup extra virgin olive oil", "Sea salt"],
    category: "Spanish",
    image: "spanish-tortilla.png",
  },
];

exports.seedDatabase = async (req, res) => {
  try {
    const { key } = req.params;

    // Security check — only allow if correct key is provided
    if (key !== SECRET_KEY) {
      return res.status(403).json({ error: "Forbidden: Invalid seed key." });
    }

    // Check if already seeded (don't wipe user-uploaded recipes)
    const existingCategories = await Category.countDocuments();
    if (existingCategories > 0) {
      return res.json({
        success: true,
        message: `Database already has ${existingCategories} categories. Skipping seed to preserve existing data.`,
        tip: "If you want to force re-seed, manually clear the Category collection in Atlas first.",
      });
    }

    // Insert categories
    await Category.insertMany(categories);

    // Insert recipes
    await Recipe.insertMany(recipes);

    res.json({
      success: true,
      message: `✅ Database seeded successfully! Inserted ${categories.length} categories and ${recipes.length} recipes.`,
      note: "You can now remove this route from your code for security.",
    });
  } catch (error) {
    console.error("Seed error:", error);
    res.status(500).json({ error: "Seeding failed: " + error.message });
  }
};
