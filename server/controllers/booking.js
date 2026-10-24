const crypto = require('crypto');
const mongoose = require('mongoose');
const Booking = require('../models/booking.js');
const Listing = require('../models/listing.js');
const Payment = require('../models/payment.js');

// POST /api/bookings - Create a booking with server-calculated price and conflict validation
module.exports.createBooking = async (req, res) => {
  const { listingId, startDate, endDate, guests } = req.body;

  if (!listingId || !startDate || !endDate) {
    return res.status(400).json({ error: 'Listing, check-in, and check-out dates are required.' });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({ error: 'Invalid check-in or check-out dates.' });
  }

  // Ensure check-in is not in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (start < today) {
    return res.status(400).json({ error: 'Check-in date cannot be in the past.' });
  }

  // Ensure end is strictly after start
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) {
    return res.status(400).json({ error: 'Check-out date must be at least one day after check-in.' });
  }

  const listing = await Listing.findById(listingId);
  if (!listing) {
    return res.status(404).json({ error: 'Listing not found.' });
  }

  // Consistency Check: Ensure no existing Confirmed booking overlaps with these dates
  const conflictingBooking = await Booking.findOne({
    listing: listingId,
    status: 'Confirmed',
    startDate: { $lt: end },
    endDate: { $gt: start },
  });

  if (conflictingBooking) {
    return res.status(400).json({
      error: 'This property is already booked for the selected dates. Please choose different dates.',
    });
  }

  // Consistency & Price Integrity: Calculate pricing on the server (do NOT trust client totalPrice)
  const nights = diffDays;
  const basePrice = (listing.price || 0) * nights;
  const cleaningFee = Math.round(basePrice * 0.15);
  const serviceFee = Math.round(basePrice * 0.08);
  const calculatedTotalPrice = basePrice + cleaningFee + serviceFee;

  const newBooking = new Booking({
    listing: listingId,
    user: req.user._id,
    startDate: start,
    endDate: end,
    guests: Math.max(1, Number(guests) || 1),
    totalPrice: calculatedTotalPrice,
    priceBreakdown: {
      nights,
      basePrice,
      cleaningFee,
      serviceFee,
    },
    status: 'Pending',
  });

  await newBooking.save();
  res.status(201).json({
    message: 'Booking reserved. Please complete payment to confirm your stay.',
    booking: newBooking,
  });
};

// GET /api/bookings - Get bookings for the current user
module.exports.getUserBookings = async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .populate('listing')
    .populate('payment')
    .sort({ createdAt: -1 });

  res.json({ bookings });
};

// GET /api/bookings/:id - Get a specific booking by ID
module.exports.getBookingById = async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('listing')
    .populate('payment');

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  // Ensure user owns this booking
  if (booking.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'Unauthorized to view this booking.' });
  }

  res.json({ booking });
};

// GET /api/bookings/:id/receipt - Get payment receipt for a confirmed booking
module.exports.getBookingReceipt = async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('listing')
    .populate('payment');

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  if (booking.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'Unauthorized to view this receipt.' });
  }

  if (booking.status !== 'Confirmed') {
    return res.status(400).json({ error: 'Receipt is only available for paid and confirmed bookings.' });
  }

  res.json({
    booking,
    payment: booking.payment,
  });
};

// POST /api/bookings/:id/pay - ACID-compliant payment processing
module.exports.processBookingPayment = async (req, res) => {
  const bookingId = req.params.id;
  const { paymentMethod = 'card', cardDetails, upiId, bankName } = req.body;

  // Validate payment method
  if (!['card', 'upi', 'netbanking'].includes(paymentMethod)) {
    return res.status(400).json({ error: 'Invalid payment method specified.' });
  }

  // 1. Initial check on booking existence and ownership
  const targetBooking = await Booking.findById(bookingId).populate('listing');
  if (!targetBooking) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  if (targetBooking.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'Unauthorized to complete payment for this booking.' });
  }

  if (targetBooking.status === 'Confirmed') {
    return res.status(400).json({ error: 'This booking has already been paid and confirmed.' });
  }

  if (targetBooking.status === 'Cancelled') {
    return res.status(400).json({ error: 'Cannot pay for a cancelled booking.' });
  }

  // 2. Consistency: Check for overlapping confirmed bookings before charging/confirming
  const conflict = await Booking.findOne({
    _id: { $ne: targetBooking._id },
    listing: targetBooking.listing._id,
    status: 'Confirmed',
    startDate: { $lt: targetBooking.endDate },
    endDate: { $gt: targetBooking.startDate },
  });

  if (conflict) {
    return res.status(409).json({
      error: 'Sorry! Another traveler has already booked this stay for the same dates. Payment could not be processed.',
    });
  }

  // 3. Prepare payment details and unique transaction ID
  const transactionId = 'TXN_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex').toUpperCase();
  const paymentDetails = {};

  if (paymentMethod === 'card') {
    paymentDetails.cardLast4 = cardDetails?.last4 || '4242';
    paymentDetails.cardBrand = cardDetails?.brand || 'VISA';
    paymentDetails.cardHolder = cardDetails?.nameOnCard || 'CARDHOLDER';
  } else if (paymentMethod === 'upi') {
    paymentDetails.upiId = upiId || 'user@upi';
  } else if (paymentMethod === 'netbanking') {
    paymentDetails.bankName = bankName || 'Bank';
  }

  // 4. ACID Execution: Try multi-document transaction; fall back to atomic CAS if standalone MongoDB
  let session = null;
  let useTransaction = false;

  try {
    session = await mongoose.startSession();
    session.startTransaction();
    useTransaction = true;
  } catch (sessErr) {
    // Standalone local MongoDB without replica set does not support transactions; proceed with atomic CAS
    useTransaction = false;
    session = null;
  }

  try {
    const sessionOpt = useTransaction ? { session } : {};

    // Double check conflict within transaction (Snapshot Isolation)
    if (useTransaction) {
      const liveConflict = await Booking.findOne({
        _id: { $ne: targetBooking._id },
        listing: targetBooking.listing._id,
        status: 'Confirmed',
        startDate: { $lt: targetBooking.endDate },
        endDate: { $gt: targetBooking.startDate },
      }).session(session);

      if (liveConflict) {
        await session.abortTransaction();
        return res.status(409).json({
          error: 'Dates were just booked by another user. Transaction aborted to prevent double booking.',
        });
      }
    }

    // Atomicity & Isolation: Atomic CAS (Compare-And-Swap) status change
    // Only updates if status is strictly 'Pending' and owned by user
    const updatedBooking = await Booking.findOneAndUpdate(
      {
        _id: bookingId,
        user: req.user._id,
        status: 'Pending',
      },
      {
        $set: {
          status: 'Confirmed',
          transactionId,
          paymentMethod,
          paidAt: new Date(),
        },
      },
      {
        new: true,
        ...sessionOpt,
      }
    );

    if (!updatedBooking) {
      if (useTransaction) await session.abortTransaction();
      return res.status(409).json({
        error: 'Booking could not be updated. It may have already been paid or modified.',
      });
    }

    // Durability: Create immutable Payment record
    const paymentDoc = new Payment({
      booking: updatedBooking._id,
      user: req.user._id,
      listing: updatedBooking.listing,
      amount: updatedBooking.totalPrice,
      currency: 'INR',
      paymentMethod,
      transactionId,
      status: 'Success',
      paymentDetails,
      createdAt: new Date(),
    });

    if (useTransaction) {
      await paymentDoc.save({ session });
    } else {
      await paymentDoc.save();
    }

    // Link payment ID to booking
    updatedBooking.payment = paymentDoc._id;
    if (useTransaction) {
      await updatedBooking.save({ session });
      await session.commitTransaction();
    } else {
      await updatedBooking.save();
    }

    return res.status(200).json({
      message: 'Payment verified and processed successfully! Stay confirmed.',
      booking: updatedBooking,
      payment: paymentDoc,
    });
  } catch (error) {
    if (useTransaction && session) {
      try {
        await session.abortTransaction();
      } catch (abortErr) {
        console.error('Error aborting transaction:', abortErr);
      }
    } else {
      // In non-replica-set mode, compensate if payment save failed after booking was marked Confirmed
      try {
        await Booking.findByIdAndUpdate(bookingId, { $set: { status: 'Pending', transactionId: null, paidAt: null } });
      } catch (revertErr) {
        console.error('Failed to rollback booking state:', revertErr);
      }
    }

    console.error('Payment processing failed:', error);
    return res.status(500).json({
      error: 'Payment processing failed: ' + (error.message || 'Server error during transaction.'),
    });
  } finally {
    if (session) {
      session.endSession();
    }
  }
};
