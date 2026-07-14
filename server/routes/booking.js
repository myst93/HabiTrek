const express = require('express');
const router = express.Router();
const wrapAsync = require('../utils/wrapAsync.js');
const { isLoggedIn } = require('../middleware.js');
const bookingController = require('../controllers/booking.js');

router.route('/')
  .post(isLoggedIn, wrapAsync(bookingController.createBooking))
  .get(isLoggedIn, wrapAsync(bookingController.getUserBookings));

router.route('/:id')
  .get(isLoggedIn, wrapAsync(bookingController.getBookingById));

router.route('/:id/pay')
  .post(isLoggedIn, wrapAsync(bookingController.processBookingPayment));

module.exports = router;
