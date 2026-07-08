const Listing = require('../models/listing.js');
const Review = require('../models/reviews.js');
const ExpressError = require('../utils/ExpressError.js');

// POST /api/listings/:id/reviews — create a review
module.exports.createReview = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) throw new ExpressError(404, 'Listing not found');

  const { review } = req.body;
  const newReview = new Review(review);
  newReview.author = req.user._id;
  listing.review.push(newReview);
  await newReview.save();
  await listing.save();

  // Re-populate the new review's author for the response
  await newReview.populate('author');
  res.status(201).json({ message: 'Review created!', review: newReview });
};

// DELETE /api/listings/:id/reviews/:reviewId — delete a review
module.exports.destroyReview = async (req, res) => {
  const { id, reviewId } = req.params;
  await Review.findByIdAndDelete(reviewId);
  await Listing.findByIdAndUpdate(id, { $pull: { review: reviewId } });
  res.json({ message: 'Review deleted!' });
};
