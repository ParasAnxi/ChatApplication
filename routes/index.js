const express = require('express');
const router = express.Router();
const userModel = require('./users');
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;

// Passport setup
passport.use(new localStrategy(userModel.authenticate()));
passport.serializeUser(userModel.serializeUser());
passport.deserializeUser(userModel.deserializeUser());

// Middleware for auth
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}

// Signup route
router.post('/signup', (req, res) => {
  const { username, FullName, PhoneNumber, password } = req.body;
  const userData = new userModel({ username, FullName, PhoneNumber });

  userModel.register(userData, password)
    .then(() => {
      passport.authenticate('local')(req, res, () => res.redirect('/profile'));
    })
    .catch(err => res.status(500).send('Registration failed: ' + err.message));
});

// Login route
router.post('/login',
  passport.authenticate('local', {
    successRedirect: '/profile',
    failureRedirect: '/login',
    failureFlash: false
  })
);

// Logout
router.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/');
  });
});

// Profile route
router.get('/profile', isLoggedIn, async (req, res) => {
  try {
    const currentUser = await userModel.findOne({ username: req.session.passport.user });
    const searchQuery = req.query.search || '';
    const users = await userModel.find({
      username: { $regex: searchQuery, $options: 'i' }
    });

    res.render('profile', { currentUser, users });
  } catch (err) {
    res.status(500).send('Error loading profile and users');
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
