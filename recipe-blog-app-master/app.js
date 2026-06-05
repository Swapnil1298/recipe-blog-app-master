// Load environment variables FIRST before anything else
require("dotenv").config();

const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const fileUpload = require("express-fileupload");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");
const connectDatabase = require("./server/models/database");

// Create an instance of Express app
const app = express();
const PORT = process.env.PORT || 3000; // Render sets PORT automatically
const SESSION_SECRET = process.env.SESSION_SECRET || "CookingBlogSecure";
const STORED_RECIPE_IMAGE = "__stored_recipe_image__";
app.locals.databaseReady = false;
app.locals.databaseError = null;

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.locals.recipeImageSrc = function recipeImageSrc(recipe) {
  if (!recipe) {
    return "/img/publish-recipe.png";
  }

  const image = String(recipe.image || "");
  if (
    image === STORED_RECIPE_IMAGE ||
    (recipe.imageData && recipe.imageData.length) ||
    /^data:image\//i.test(image)
  ) {
    return `/recipe/${recipe._id}/image`;
  }

  if (/^https?:\/\//i.test(image) || image.startsWith("/")) {
    return image;
  }

  if (/masala\s+tea/i.test(recipe.name || "")) {
    return "/uploads/indian-masala-tea.png";
  }

  return image ? `/uploads/${encodeURIComponent(image)}` : "/img/publish-recipe.png";
};

app.locals.recipeHasImage = function recipeHasImage(recipe) {
  if (!recipe) {
    return false;
  }

  return Boolean(
    (recipe.imageData && recipe.imageData.length) ||
    recipe.image ||
    /masala\s+tea/i.test(recipe.name || "")
  );
};

app.locals.averageRating = function averageRating(recipe) {
  if (!recipe || !recipe.ratings || recipe.ratings.length === 0) {
    return 0;
  }

  const total = recipe.ratings.reduce((sum, rating) => sum + rating.value, 0);
  return total / recipe.ratings.length;
};

app.locals.userHasRecipe = function userHasRecipe(recipeIds, recipeId) {
  return (recipeIds || []).some((id) => id && id.toString() === recipeId.toString());
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Set up middlewares
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.static("public")); // Serve static files from the "public" directory
app.use(expressLayouts); // Use express-ejs-layouts for layout support in EJS templates

// Cookie and session management
app.use(cookieParser(SESSION_SECRET));

const sessionOptions = {
  secret: SESSION_SECRET,
  saveUninitialized: false,
  resave: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  },
};

if (process.env.MONGO_URI) {
  sessionOptions.store = MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: "sessions",
  });
}

app.use(session(sessionOptions));

// Flash messages middleware
app.use(flash());

// Middleware to handle file uploads
app.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 },
  abortOnLimit: true,
  responseOnLimit: "Image uploads must be 5MB or smaller.",
}));

// Set the layout file for rendering views
app.set("layout", "./layouts/main");

// Set the view engine to EJS
app.set("view engine", "ejs");

app.use((req, res, next) => {
  if (app.locals.databaseReady) {
    return next();
  }

  const databaseMessage = escapeHtml(
    app.locals.databaseError || "MongoDB is still connecting. Please refresh in a moment."
  );

  return res.status(503).send(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Database connection unavailable</title>
        <style>
          body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            font-family: Arial, sans-serif;
            background: #f8f5f0;
            color: #2d2723;
          }

          main {
            width: min(92vw, 560px);
            padding: 28px;
            border: 1px solid #e2d8ce;
            border-radius: 8px;
            background: #fffdf9;
            box-shadow: 0 16px 40px rgba(45, 39, 35, 0.08);
          }

          h1 {
            margin: 0 0 12px;
            font-size: 24px;
          }

          p {
            margin: 0 0 12px;
            line-height: 1.5;
          }

          code {
            padding: 2px 5px;
            border-radius: 4px;
            background: #f0e8df;
          }
        </style>
      </head>
      <body>
        <main>
          <h1>Database connection unavailable</h1>
          <p>${databaseMessage}</p>
          <p>Update <code>MONGO_URI</code> in your environment, then restart the app.</p>
        </main>
      </body>
    </html>
  `);
});

// Global session middleware to fetch current user
const User = require("./server/models/User");
app.use(async (req, res, next) => {
  res.locals.user = null;
  if (req.session && req.session.userId) {
    try {
      const user = await User.findById(req.session.userId);
      if (user) {
        res.locals.user = user;
      }
    } catch (error) {
      console.error("Error fetching user in session middleware:", error);
    }
  }
  next();
});

// Define routes
const routes = require("./server/routes/recipeRoutes.js"); // Import routes from recipeRoutes.js
app.use("/", routes); // Use the routes

async function connectDatabaseInBackground() {
  try {
    await connectDatabase();
    app.locals.databaseReady = true;
    app.locals.databaseError = null;
  } catch (error) {
    app.locals.databaseError = error.message;
    console.error(error.message);
  }
}

function startServer() {
  app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}...`);
    connectDatabaseInBackground();
  });
}

startServer();
