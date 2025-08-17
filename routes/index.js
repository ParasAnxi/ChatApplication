const express = require('express');
const router = express.Router();
const userModel = require('./users');
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;

// Passport setup
passport.use(new localStrategy(userModel.authenticate()));
passport.serializeUser(userModel.serializeUser());
passport.deserializeUser(userModel.deserializeUser());

// Middleware to check if a user is authenticated
function isLoggedIn(req, res, next) {
  // If the user is authenticated, continue to the next middleware
  if (req.isAuthenticated()) return next();
  // Otherwise, redirect them to the login page
  res.redirect('/login');
}

// Corrected profile route with proper parameter order and security middleware
router.get('/profile', isLoggedIn, (req, res) => {
  res.render('profile');
});

// Signup route
router.post('/signup', (req, res) => {
  const { username, FullName, PhoneNumber, password } = req.body;
  // Create a new user instance
  const userData = new userModel({ username, FullName, PhoneNumber });

  // Register the user with the given password
  userModel.register(userData, password)
    .then(() => {
      // Authenticate the user after successful registration and redirect to home
      passport.authenticate('local')(req, res, () => res.redirect('/home'));
    })
    .catch(err => {
      // Handle registration errors
      res.status(500).send('Registration failed: ' + err.message);
    });
});

// Login route
router.post('/login',
  // Use Passport's authenticate middleware
  passport.authenticate('local', {
    successRedirect: '/home', // Redirect to home on successful login
    failureRedirect: '/login', // Redirect back to login on failure
    failureFlash: false // Disable flash messages for this example
  })
);

// Logout route
router.get('/logout', (req, res, next) => {
  // Use req.logout to log the user out
  req.logout(err => {
    if (err) return next(err);
    // Redirect to the home page after logout
    res.redirect('/');
  });
});

// Home route, protected by isLoggedIn middleware
router.get('/home', isLoggedIn, async (req, res) => {
  try {
    // Find the currently logged-in user
    const currentUser = await userModel.findOne({ username: req.session.passport.user });
    const searchQuery = req.query.search || '';

    // Find users whose username or FullName matches the search query (case-insensitive)
    const users = await userModel.find({
      $or: [
        { username: { $regex: searchQuery, $options: 'i' } },
        { FullName: { $regex: searchQuery, $options: 'i' } }
      ]
    });

    // Render the home page with the user data
    res.render('home', { currentUser, users });
  } catch (err) {
    // Handle database errors
    res.status(500).send('Error loading profile and users: ' + err.message);
  }
});

// Signup page
router.get('/', (req, res) => {
  res.render('signup');
});

// Login page
router.get('/login', (req, res) => {
  res.render('login');
});

module.exports = router;
