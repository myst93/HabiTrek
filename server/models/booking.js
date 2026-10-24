const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
  listing: {
    type: Schema.Types.ObjectId,
    ref: 'Listing',
    required: true,
    index: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  guests: {
    type: Number,
    required: true,
    default: 1,
    min: 1,
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  priceBreakdown: {
    nights: { type: Number, default: 1 },
    basePrice: { type: Number, default: 0 },
    cleaningFee: { type: Number, default: 0 },
    serviceFee: { type: Number, default: 0 },
  },
  status: {
    type: String,
    enum: ['Confirmed', 'Pending', 'Cancelled'],
    default: 'Pending',
    index: true,
  },
  payment: {
    type: Schema.Types.ObjectId,
    ref: 'Payment',
  },
  transactionId: {
    type: String,
    index: true,
  },
  paymentMethod: {
    type: String,
  },
  paidAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index to optimize date overlap and availability searches
bookingSchema.index({ listing: 1, status: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
