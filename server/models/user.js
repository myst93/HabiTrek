const mongoose = require('mongoose'); //it is library  that interacts with the MongoDB database and provides a schema-based solution to model the application data
const Schema = mongoose.Schema; //for creating the schema of the user model it is like a blueprint of the user model which defines the structure of the user document in the database
const PassportLocalMongoose = require('passport-local-mongoose'); //used to handle the authentication part

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
//what is plugin in mongoose? A plugin is a reusable piece of code that can be added to a Mongoose schema to extend its functionality. It allows developers to encapsulate common behaviors or features and apply them to multiple schemas without duplicating code. Plugins can add methods, virtuals, middleware, or other functionalities to the schema, making it easier to manage and maintain the codebase.
userSchema.plugin(PassportLocalMongoose); //it is a plugin that adds methods to the user schema for handling user authentication, such as hashing passwords and verifying credentials. It simplifies the process of implementing user authentication in the application.

module.exports = mongoose.model('User', userSchema);
