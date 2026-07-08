const express = require('express');
const router = express.Router({ mergeParams: true });
const wrapAsync = require('../utils/wrapAsync.js');
const { isLoggedIn, isReviewAuthor, validateReview } = require('../middleware.js');
const ReviewController = require('../controllers/reviews.js');

// POST /api/listings/:id/reviews
router.post('/', isLoggedIn, validateReview, wrapAsync(ReviewController.createReview));

// DELETE /api/listings/:id/reviews/:reviewId
router.delete('/:reviewId', isLoggedIn, isReviewAuthor, wrapAsync(ReviewController.destroyReview));

module.exports = router;
