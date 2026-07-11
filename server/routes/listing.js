const express = require('express');
const router = express.Router();
const wrapAsync = require('../utils/wrapAsync.js');
const { isLoggedIn, isOwner, validateListing } = require('../middleware.js');
const listingController = require('../controllers/listing.js');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

let storage;
if (process.env.CLOUD_API_KEY && process.env.CLOUD_NAME && process.env.CLOUD_API_SECRET) {
  try {
    const { storage: cloudStorage } = require('../cloudConfig.js');
    storage = cloudStorage;
  } catch (err) {
    console.warn('⚠️ Cloudinary setup failed, falling back to local storage:', err.message);
  }
}

if (!storage) {
  const uploadDir = path.join(__dirname, '../public/uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
}

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
