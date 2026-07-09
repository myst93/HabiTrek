const User = require('../models/user.js');

// POST /api/signup — register a new user and log them in
module.exports.signup = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const newUser = new User({ email, username });
    const registeredUser = await User.register(newUser, password);
    req.login(registeredUser, (err) => {
      if (err) return next(err);
      res.status(201).json({
        message: 'Welcome to HabiTrek!',
        user: { _id: registeredUser._id, username: registeredUser.username, email: registeredUser.email },
      });
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// POST /api/login — Passport handles authentication; this runs on success
module.exports.login = (req, res) => {
  res.json({
    message: `Welcome back, ${req.user.username}!`,
    user: { _id: req.user._id, username: req.user.username, email: req.user.email },
  });
};

// GET /api/logout — log the user out
module.exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.json({ message: 'You have been logged out.' });
  });
};

// GET /api/me — return currently logged-in user (or null)
module.exports.me = (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      user: {
        _id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        wishlist: req.user.wishlist || [],
        bio: req.user.bio,
        phone: req.user.phone,
        location: req.user.location,
        avatar: req.user.avatar,
        createdAt: req.user.createdAt,
      },
    });
  } else {
    res.json({ user: null });
  }
};

// PUT /api/profile — update current user profile details
module.exports.updateProfile = async (req, res) => {
  const { bio, phone, location, avatar } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  if (bio !== undefined) user.bio = bio;
  if (phone !== undefined) user.phone = phone;
  if (location !== undefined) user.location = location;
  if (avatar !== undefined) user.avatar = avatar;

  await user.save();
  res.json({
    message: 'Profile updated successfully!',
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      wishlist: user.wishlist || [],
      bio: user.bio,
      phone: user.phone,
      location: user.location,
      avatar: user.avatar,
      createdAt: user.createdAt,
    },
  });
};

// POST /api/wishlist/toggle/:listingId - Toggle a listing in the wishlist
module.exports.toggleWishlist = async (req, res) => {
  const { listingId } = req.params;
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const index = user.wishlist.indexOf(listingId);
  let added = false;
  if (index === -1) {
    user.wishlist.push(listingId);
    added = true;
  } else {
    user.wishlist.splice(index, 1);
  }

  await user.save();
  res.json({ message: added ? 'Added to wishlist!' : 'Removed from wishlist!', wishlist: user.wishlist, added });
};

// GET /api/wishlist - Get all wishlist items for current user
module.exports.getWishlist = async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist');
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  res.json({ wishlist: user.wishlist || [] });
};

