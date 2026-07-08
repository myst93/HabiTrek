const Booking = require('../models/booking.js');
const Listing = require('../models/listing.js');

// POST /api/bookings - Create a booking
module.exports.createBooking = async (req, res) => {
  const { listingId, startDate, endDate, guests, totalPrice } = req.body;

  if (!listingId || !startDate || !endDate || !guests || !totalPrice) {
    return res.status(400).json({ error: 'Missing required booking fields.' });
  }

  const listing = await Listing.findById(listingId);
  if (!listing) {
    return res.status(404).json({ error: 'Listing not found.' });
  }

  const newBooking = new Booking({
    listing: listingId,
    user: req.user._id,
    startDate,
    endDate,
    guests,
    totalPrice,
    status: 'Confirmed', // Automatically confirm in this mock flow
  });

  await newBooking.save();
  res.status(201).json({ message: 'Booking confirmed successfully!', booking: newBooking });
};

// GET /api/bookings - Get bookings for the current user
module.exports.getUserBookings = async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .populate('listing')
    .sort({ createdAt: -1 });

  res.json({ bookings });
};
