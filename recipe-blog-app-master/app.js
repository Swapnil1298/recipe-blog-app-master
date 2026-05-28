// Load environment variables FIRST before anything else
require("dotenv").config();

const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const fileUpload = require("express-fileupload");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");

// Create an instance of Express app
const app = express();
const PORT = process.env.PORT || 3000; // Render sets PORT automatically
const SESSION_SECRET = process.env.SESSION_SECRET || "CookingBlogSecure";

// Set up middlewares
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.static("public")); // Serve static files from the "public" directory
app.use(expressLayouts); // Use express-ejs-layouts for layout support in EJS templates

// Cookie and session management
app.use(cookieParser(SESSION_SECRET));
app.use(
  session({
    secret: SESSION_SECRET,
    saveUninitialized: true, // Save new sessions
    resave: true, // Forces the session to be saved back to the session store
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

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}...`);
});
