const User = require("../models/User");
const bcrypt = require("bcryptjs");

/**
 * GET /register
 * Register Page
 */
exports.getRegister = async (req, res) => {
  const infoErrorsObj = req.flash("infoErrors");
  const infoSubmitObj = req.flash("infoSubmit");
  res.render("register", {
    title: "Cooking Blog - Register",
    infoErrorsObj,
    infoSubmitObj,
  });
};

/**
 * POST /register
 * Register Submit
 */
exports.postRegister = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      req.flash("infoErrors", "Email is already registered.");
      return res.redirect("/register");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    await newUser.save();

    req.flash("infoSubmit", "Registration successful! You can now log in.");
    res.redirect("/login");
  } catch (error) {
    req.flash("infoErrors", error.message);
    res.redirect("/register");
  }
};

/**
 * GET /login
 * Login Page
 */
exports.getLogin = async (req, res) => {
  const infoErrorsObj = req.flash("infoErrors");
  const infoSubmitObj = req.flash("infoSubmit");
  res.render("login", {
    title: "Cooking Blog - Login",
    infoErrorsObj,
    infoSubmitObj,
  });
};

/**
 * POST /login
 * Login Submit
 */
exports.postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      req.flash("infoErrors", "Invalid email or password.");
      return res.redirect("/login");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      req.flash("infoErrors", "Invalid email or password.");
      return res.redirect("/login");
    }

    req.session.userId = user._id;
    res.redirect("/");
  } catch (error) {
    req.flash("infoErrors", error.message);
    res.redirect("/login");
  }
};

/**
 * GET /logout
 * Logout
 */
exports.logout = async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
    }
    res.redirect("/");
  });
};
