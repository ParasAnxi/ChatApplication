const express = require('express');
const router = express.Router();
const userModel = require('./users'); // This is your mongoose model with passport-local-mongoose
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;

// Passport setup
passport.use(new localStrategy(userModel.authenticate()));
passport.serializeUser(userModel.serializeUser());
passport.deserializeUser(userModel.deserializeUser());

// Middleware to check if a user is authenticated
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}

// Profile route
router.get('/profile', isLoggedIn, (req, res) => {
  res.render('profile');
});

// Signup route
router.post('/signup', (req, res) => {
  const { username, FullName, password } = req.body;
  const userData = new userModel({ username, FullName});

  userModel.register(userData, password)
    .then(() => {
      passport.authenticate('local')(req, res, () => res.redirect('/home'));
    })
    .catch(err => res.status(500).send('Registration failed: ' + err.message));
});

// Login route
router.post('/login',
  passport.authenticate('local', {
    successRedirect: '/home',
    failureRedirect: '/login',
    failureFlash: false
  })
);

// Logout route
router.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/');
  });
});

// Home route with search + requests/friends
// Example route
router.get('/home', isLoggedIn, async (req, res) => {
  try {
    const currentUser = await userModel.findById(req.user._id)
      .populate('requests')
      .populate('friends')
      .exec();

    const users = await userModel.find({ _id: { $ne: req.user._id } });

    res.render('home', {
      currentUser,
      users
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});



// ✅ Send Friend Request
router.post("/add/:id", isLoggedIn, async (req, res) => {
  try {
    const me = await userModel.findById(req.user._id);
    const other = await userModel.findById(req.params.id);

    if (!other.requests.includes(me._id) && !other.friends.includes(me._id)) {
      other.requests.push(me._id); // my request goes into "other" user's requests
      await other.save();
    }
    res.redirect("/home");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error sending request");
  }
});

// ✅ Accept Friend Request
router.post("/accept/:id", isLoggedIn, async (req, res) => {
  try {
    const me = await userModel.findById(req.user._id);
    const other = await userModel.findById(req.params.id);

    // Check if this request exists
    if (me.requests.includes(other._id)) {
      // Add each other to friends list
      me.friends.push(other._id);
      other.friends.push(me._id);

      // Remove request
      me.requests = me.requests.filter(r => r.toString() !== other._id.toString());

      await me.save();
      await other.save();
    }
    res.redirect("/home");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error accepting request");
  }
});

// ✅ Reject Friend Request
router.post("/reject/:id", isLoggedIn, async (req, res) => {
  try {
    const me = await userModel.findById(req.user._id);

    // Just remove from requests
    me.requests = me.requests.filter(r => r.toString() !== req.params.id);

    await me.save();
    res.redirect("/home");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error rejecting request");
  }
});


// Signup page
router.get('/', (req, res) => res.render('signup'));

// Login page
router.get('/login', (req, res) => res.render('login'));

module.exports = router;
