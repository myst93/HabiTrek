require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session'); //this is a middleware that allows you to manage user sessions in your Express application. It provides a way to store and retrieve session data for individual users across multiple requests, enabling features like user authentication and maintaining user state.
const { MongoStore } = require('connect-mongo'); //It is a session store for Express that uses MongoDB to persist session data. It allows you to store user session information in a MongoDB database, making it suitable for applications that require session management across multiple server instances or when you want to maintain session data even after server restarts.
const passport = require('passport');
const LocalStrategy = require('passport-local');
const cors = require('cors'); //it is a middleware that allows you to enable Cross-Origin Resource Sharing (CORS) in your Express application. CORS is a security feature implemented by web browsers that restricts web pages from making requests to a different domain than the one that served the web page. The cors middleware helps you configure and handle CORS-related headers and policies, allowing your server to accept requests from specified origins or domains.
const User = require('./models/user.js');

const listingRouter = require('./routes/listing.js');
const reviewRouter = require('./routes/review.js');
const userRouter = require('./routes/user.js');
const aiRouter = require('./routes/ai.js');
const bookingRouter = require('./routes/booking.js');

const app = express();

// Trust reverse proxy (e.g. Render, Heroku, Nginx) so HTTPS cookies work in production
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

const dbUrl = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/HabiTrek';
const secret = process.env.SECRET || 'fallback-secret-change-me';

// ─── Database & Session Store ──────────────────────────────────────────────────
const dbPromise = mongoose
  .connect(dbUrl)
  .then((m) => {
    console.log('✅ Database connected');
    return m.connection.getClient();
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message || err);
    return null;
  });

// Auto-seed only in development or if explicitly requested via SEED_DB env variable
if (process.env.NODE_ENV !== 'production' || process.env.SEED_DB === 'true') {
  dbPromise.then(async () => {
    try {
      const Listing = require('./models/listing.js');
      const sampleListings = require('./utils/sampleListings.js');
      const User = require('./models/user.js');
      let owner = await User.findOne({ username: 'admin' });
      if (!owner) {
        const newUser = new User({ email: 'admin@HabiTrek.com', username: 'admin' });
        owner = await User.register(newUser, 'admin123');
      }
      
      const existingListings = await Listing.find({}, 'title');
      const existingTitles = new Set(existingListings.map(l => l.title));
      const listingsToInsert = sampleListings
        .filter(l => !existingTitles.has(l.title))
        .map(l => ({ ...l, owner: owner._id }));

      if (listingsToInsert.length > 0) {
        console.log(`🌱 Seeding ${listingsToInsert.length} new sample listings...`);
        await Listing.insertMany(listingsToInsert);
        console.log('✅ Seeding completed successfully!');
      }
    } catch (e) {
      console.error('❌ Auto-seeding failed:', e);
    }
  }).catch(() => {});
}

// ─── Middleware ───────────────────────────────────────────────────────────────
// Allow Vite dev server and production origins to send cookies
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, or same-origin server-to-server)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        'https://habitrek.onrender.com',
        'https://habi-trek.vercel.app',
      ];

      // Support comma-separated CLIENT_ORIGIN
      if (process.env.CLIENT_ORIGIN) {
        process.env.CLIENT_ORIGIN.split(',').forEach((orig) => {
          const trimmed = orig.trim().replace(/\/$/, '');
          if (trimmed) allowedOrigins.push(trimmed);
        });
      }

      const cleanOrigin = origin.replace(/\/$/, '');

      // Localhost checks (dev servers)
      const isLocalhost =
        cleanOrigin.startsWith('http://localhost:') ||
        cleanOrigin.startsWith('http://127.0.0.1:') ||
        cleanOrigin === 'http://localhost' ||
        cleanOrigin === 'http://127.0.0.1';

      // Vercel deployment preview / prod domains
      const isVercel = cleanOrigin.endsWith('.vercel.app');

      // Direct IP address deployment (IPv4 with optional port, e.g. AWS EC2 http://18.234.66.155)
      const isIpAddress = /^https?:\/\/(\d{1,3}\.){3}\d{1,3}(:\d+)?$/.test(cleanOrigin);

      // AWS EC2 public DNS hostnames (e.g. ec2-xx-xx-xx-xx.compute-1.amazonaws.com)
      const isAwsEc2 = /^https?:\/\/ec2-[^.]+\.compute(-1)?\.amazonaws\.com(:\d+)?$/.test(cleanOrigin);

      // Wildcard check
      const allowAll = process.env.CLIENT_ORIGIN === '*';

      if (allowAll || allowedOrigins.includes(cleanOrigin) || isLocalhost || isVercel || isIpAddress || isAwsEc2) {
        callback(null, true);
      } else {
        console.warn(`⚠️ CORS blocked request from origin: ${origin}`);
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    },
    credentials: true, // allow cookies (sessions) to be sent cross-origin
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// ─── Sessions ─────────────────────────────────────────────────────────────────
const store = MongoStore.create({
  clientPromise: dbPromise,
  crypto: { secret },
  touchAfter: 24 * 3600,
});

store.on('error', (err) => console.error('Session store error:', err));

// In production on HTTPS (e.g. Render backend + Vercel frontend), secure=true & sameSite='none' are required.
// In HTTP deployments (e.g. direct AWS EC2 public IP http://18.234.66.155 without SSL), secure must be false
// and sameSite must be 'lax' so browsers don't reject cookies.
const isProduction = process.env.NODE_ENV === 'production';
const isExplicitSecure = process.env.COOKIE_SECURE === 'true';
const isExplicitInsecure = process.env.COOKIE_SECURE === 'false';
const hasHttpOrigin =
  process.env.CLIENT_ORIGIN &&
  process.env.CLIENT_ORIGIN.split(',').some((o) => o.trim().startsWith('http://'));

const cookieSecure = isExplicitSecure || (isProduction && !isExplicitInsecure && !hasHttpOrigin);
const cookieSameSite = cookieSecure ? 'none' : 'lax';

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
      sameSite: cookieSameSite,
      secure: cookieSecure,
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
