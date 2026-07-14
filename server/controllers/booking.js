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
    status: 'Pending', // Initialize as Pending for checkout
  });

  await newBooking.save();
  res.status(201).json({ message: 'Booking requested successfully. Please complete payment.', booking: newBooking });
};

// GET /api/bookings - Get bookings for the current user
module.exports.getUserBookings = async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .populate('listing')
    .sort({ createdAt: -1 });

  res.json({ bookings });
};

// GET /api/bookings/:id - Get a specific booking by ID
module.exports.getBookingById = async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('listing');

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  // Ensure user owns this booking
  if (booking.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'Unauthorized to view this booking.' });
  }

  res.json({ booking });
};

// POST /api/bookings/:id/pay - Mark booking as paid (Confirmed)
module.exports.processBookingPayment = async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  // Ensure user owns this booking
  if (booking.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'Unauthorized to complete payment for this booking.' });
  }

  if (booking.status === 'Confirmed') {
    return res.status(400).json({ error: 'This booking has already been paid.' });
  }

  booking.status = 'Confirmed';
  await booking.save();

  res.json({ message: 'Payment successful! Booking confirmed.', booking });
};

