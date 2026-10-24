const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const paymentSchema = new Schema({
  booking: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    index: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  listing: {
    type: Schema.Types.ObjectId,
    ref: 'Listing',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    default: 'INR',
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'upi', 'netbanking'],
    required: true,
  },
  transactionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['Success', 'Failed', 'Refunded'],
    default: 'Success',
    required: true,
  },
  paymentDetails: {
    cardLast4: String,
    cardBrand: String,
    cardHolder: String,
    upiId: String,
    bankName: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Payment', paymentSchema);
