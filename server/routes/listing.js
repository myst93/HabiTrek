const express = require('express');
const router = express.Router();
const wrapAsync = require('../utils/wrapAsync.js');
const { isLoggedIn, isOwner, validateListing } = require('../middleware.js');
const listingController = require('../controllers/listing.js');
const multer = require('multer');
const { storage } = require('../cloudConfig.js');
const upload = multer({ storage });

// GET /api/listings & POST /api/listings
router
  .route('/')
  .get(wrapAsync(listingController.index))
  .post(isLoggedIn, upload.single('image'), validateListing, wrapAsync(listingController.createListing));

// GET /api/listings/:id & PUT /api/listings/:id & DELETE /api/listings/:id
router
  .route('/:id')
  .get(wrapAsync(listingController.showListing))
  .put(isLoggedIn, isOwner, upload.single('image'), wrapAsync(listingController.updateListing))
  .delete(isLoggedIn, isOwner, wrapAsync(listingController.destroyListing));

module.exports = router;
