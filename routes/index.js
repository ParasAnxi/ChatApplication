var express = require('express');
var router = express.Router();
const userModel = require('./users');
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;

passport.use(new localStrategy(userModel.authenticate()));
passport.serializeUser(userModel.serializeUser());
passport.deserializeUser(userModel.deserializeUser());

// Middleware
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}

router.post('/signup', (req, res) => {
  const { username, FullName, PhoneNumber, password } = req.body;
  const userData = new userModel({ username, FullName, PhoneNumber });

  userModel.register(userData, password)
    .then(() => {
      passport.authenticate('local')(req, res, () => res.redirect('/profile'));
    })
    .catch(err => res.status(500).send('Registration failed: ' + err.message));
});

router.get('/profile', isLoggedIn, async (req, res) => {
  const user = await userModel.findOne({ username: req.session.passport.user });
  res.render('profile', { user });
});

router.post('/login',
  passport.authenticate('local', {
    successRedirect: '/profile',
    failureRedirect: '/login',
    failureFlash: true
  })
);

router.get('/', function(req, res, next) {
  res.render('signup', { title: 'Express' });
});

router.get('/login', (req, res) => {
  res.render('login');
});

router.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/');
  });
});

module.exports = router;
