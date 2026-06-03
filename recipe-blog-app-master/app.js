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
app.locals.databaseReady = false;
app.locals.databaseError = null;

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

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
app.use(
  session({
    secret: SESSION_SECRET,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
    }),
    saveUninitialized: false,
    resave: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  })
);

// Flash messages middleware
app.use(flash());

// Middleware to handle file uploads
app.use(fileUpload());

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

async function startServer() {
  try {
    await connectDatabase();
    app.locals.databaseReady = true;
  } catch (error) {
    app.locals.databaseError = error.message;
    console.error(error.message);
  }

  app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}...`);
  });
}

startServer();
