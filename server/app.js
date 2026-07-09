if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const cors = require('cors');
const User = require('./models/user.js');

const listingRouter = require('./routes/listing.js');
const reviewRouter = require('./routes/review.js');
const userRouter = require('./routes/user.js');
const aiRouter = require('./routes/ai.js');
const bookingRouter = require('./routes/booking.js');

const app = express();

const dbUrl = process.env.ATLAS_DB_URL || 'mongodb://127.0.0.1:27017/HabiTrek';
const secret = process.env.SECRET || 'fallback-secret-change-me';

// ─── Database ────────────────────────────────────────────────────────────────
mongoose
  .connect(dbUrl)
  .then(async () => {
    console.log('✅ Database connected');
    try {
      const Listing = require('./models/listing.js');
      const count = await Listing.countDocuments();
      if (count === 0) {
        console.log('🌱 Database is empty. Seeding sample listings...');
        const sampleListings = require('./utils/sampleListings.js');
        const User = require('./models/user.js');
        let owner = await User.findOne({ username: 'admin' });
        if (!owner) {
          const newUser = new User({ email: 'admin@HabiTrek.com', username: 'admin' });
          owner = await User.register(newUser, 'admin123');
        }
        const listingsWithOwner = sampleListings.map(l => ({ ...l, owner: owner._id }));
        await Listing.insertMany(listingsWithOwner);
        console.log('✅ Seeding completed successfully!');
      }
    } catch (e) {
      console.error('❌ Auto-seeding failed:', e);
    }
  })
  .catch((err) => console.error('❌ Database connection failed:', err));

// ─── Middleware ───────────────────────────────────────────────────────────────
// Allow the Vite dev server (port 5173) and production origin to send cookies
app.use(
  cors({
    origin: [
      'http://localhost:5173', // Vite dev
      'http://localhost:4173', // Vite preview
      process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    ],
    credentials: true, // allow cookies (sessions) to be sent cross-origin
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Sessions ─────────────────────────────────────────────────────────────────
const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: { secret },
  touchAfter: 24 * 3600,
});

store.on('error', (err) => console.error('Session store error:', err));

app.use(
  session({
    store,
    secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  })
);

// ─── Passport ─────────────────────────────────────────────────────────────────
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/listings', listingRouter);
app.use('/api/listings/:id/reviews', reviewRouter);
app.use('/api/ai', aiRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api', userRouter);

// ─── Global Error Handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  const { statusCode = 500, message = 'Something went wrong' } = err;
  res.status(statusCode).json({ error: message });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
