const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const PassportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
    },
    wishlist: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Listing',
      },
    ],
    bio: {
      type: String,
      default: 'Hello! I am a passionate traveler and love exploring new stays on HabiTrek.',
    },
    phone: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: 'Earth',
    },
    avatar: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

userSchema.plugin(PassportLocalMongoose);

module.exports = mongoose.model('User', userSchema);
