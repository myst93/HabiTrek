const express = require('express');
const router = express.Router();
const wrapAsync = require('../utils/wrapAsync');
const passport = require('passport');
const { saveRedirectUrl, isLoggedIn } = require('../middleware.js');
const userController = require('../controllers/user.js');

// GET /api/me — check current session user
router.get('/me', userController.me);

// POST /api/signup
router.post('/signup', wrapAsync(userController.signup));

// POST /api/login — Passport local strategy
router.post(
  '/login',
  saveRedirectUrl,
  passport.authenticate('local', {
    failWithError: true, // passes error to next() instead of redirect on failure
  }),
  userController.login
);

// Handle passport authentication failure — return JSON 401
router.use((err, req, res, next) => {
  if (err && err.status === 401) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }
  next(err);
});

// GET /api/logout
router.get('/logout', userController.logout);

// Wishlist endpoints
router.post('/wishlist/toggle/:listingId', isLoggedIn, wrapAsync(userController.toggleWishlist));
router.get('/wishlist', isLoggedIn, wrapAsync(userController.getWishlist));

module.exports = router;
