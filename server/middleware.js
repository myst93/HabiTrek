const Listing = require('./models/listing');
const Review = require('./models/reviews');
const ExpressError = require('./utils/ExpressError.js');
const { listingSchema, reviewSchema } = require('./schema.js');

// Ensures the user is authenticated; returns 401 JSON if not (React frontend handles redirect)
module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'You must be logged in to do that.' });
  }
  next();
};

// Saves the URL the user tried to visit before being redirected to login
module.exports.saveRedirectUrl = (req, res, next) => {
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
  }
  next();
};

// Ensures only the owner of a listing can edit/delete it
module.exports.isOwner = async (req, res, next) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    return res.status(404).json({ error: 'Listing not found.' });
  }
  if (!listing.owner._id.equals(req.user._id)) {
    return res.status(403).json({ error: 'You are not the owner of this listing.' });
  }
  next();
};

// Validates listing body using Joi schema
module.exports.validateListing = (req, res, next) => {
  const { error } = listingSchema.validate(req.body);
  if (error) {
    const errmsg = error.details.map((el) => el.message).join(', ');
    throw new ExpressError(400, errmsg);
  } else {
    next();
  }
};

// Validates review body using Joi schema
module.exports.validateReview = (req, res, next) => {
  const body = req.body || {};
  const review = body.review;
  if (!review || typeof review !== 'object') {
    return next(new ExpressError(400, 'Invalid Review Data'));
  }
  const { error } = reviewSchema.validate(body);
  if (error) {
    const errmsg = error.details.map((el) => el.message).join(', ');
    return next(new ExpressError(400, errmsg));
  }
  next();
};

// Ensures only the author of a review can delete it
module.exports.isReviewAuthor = async (req, res, next) => {
  const { reviewId } = req.params;
  const review = await Review.findById(reviewId);
  if (!review) {
    return res.status(404).json({ error: 'Review not found.' });
  }
  if (!review.author.equals(req.user._id)) {
    return res.status(403).json({ error: 'You are not the author of this review.' });
  }
  next();
};
