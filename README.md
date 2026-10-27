# 🏡 HabiTrek

> A modern, full-stack vacation-rental platform (inspired by Airbnb) featuring comprehensive listing management, AI travel recommendations, an **ACID-compliant payment & reservation engine**, and **Docker containerization**.

---

## 📑 Table of Contents
- [✨ Key Features](#-key-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [🏗️ System & Transaction Architecture](#️-system--transaction-architecture)
- [📂 Project Structure](#-project-structure)
- [⚙️ Environment Variables](#️-environment-variables)
- [🚀 Quick Start Guide](#-quick-start-guide)
  - [Option A: Running with Docker (Recommended)](#option-a-running-with-docker-recommended)
  - [Option B: Running Locally (Development)](#option-b-running-locally-development)
- [📡 API Documentation](#-api-documentation)
- [🛡️ ACID Payment Verification](#️-acid-payment-verification)
- [🤝 Contributing & License](#-contributing--license)

---

## ✨ Key Features

### 1. 🏠 Listings & Stays
- **Full CRUD operations**: Create, update, view, and delete stays.
- **Categorization**: Filter stays across 11+ categories (*Trending, Rooms, Iconic Cities, Mountains, Castles, Amazing Pools, Camping, Farms, Arctic, Domes, Boats*).
- **Interactive Mapping & Geo-Location**: Map integration for stays with precise coordinate views.
- **Cloudinary Image Uploads**: Multi-part form image uploads backed by Cloudinary storage.

### 2. 💳 ACID-Compliant Payment & Booking Engine
- **Atomicity**: Multi-document MongoDB transactions (`session.startTransaction()`) guarantee that reserving dates, confirming status, and writing financial ledger entries succeed together or cleanly roll back.
- **Consistency**:
  - **Server-Side Price Recalculation**: The backend independently enforces base pricing, 15% cleaning fee, and 8% service fee, preventing client price tampering.
  - **Collision & Overbooking Prevention**: Strict date overlap checks reject double bookings for the same property during identical date ranges.
  - **Date Validation**: Enforces valid date ranges (`startDate >= today` and `endDate > startDate`).
- **Isolation**: Atomic Compare-And-Swap (CAS) state changes prevent TOCTOU race conditions and duplicate double-click charges.
- **Durability**: Every transaction generates an immutable `Payment` record in the database with a cryptographically secure `transactionId` and audit log.
- **Rich Checkout UI**: Live credit card preview with auto brand detection (Visa, Mastercard, RuPay, Amex), UPI QR code & VPA input, and Net Banking selectors.
- **Itemized Receipts**: Built-in invoice view, transaction badge with copy-to-clipboard, and printable receipt support (`window.print()`).

### 3. 🤖 AI Travel Assistant
- Integrated with **Google Gemini API** (`@google/generative-ai`) to offer intelligent travel assistance, property suggestions, and itinerary Q&A directly within stay views.

### 4. 🔐 Authentication & Authorization
- Session-based authentication via **Passport.js** (Local Strategy).
- Persistent sessions stored securely in MongoDB via `connect-mongo`.
- Role-based authorization middleware: only listing owners can modify/delete listings; only review authors can delete reviews.

### 5. 🐳 Full Docker Containerization
- **Multi-Stage Frontend Build**: React app compiled with Vite and served via an optimized, lightweight **Nginx Alpine** image with gzip compression, caching headers, and SPA routing.
- **Production Backend Container**: Lightweight **Node.js 20 Alpine** container with cached dependency layers.
- **Nginx Reverse Proxy**: Automatic internal routing for `/api/*` to the backend, preventing cross-origin CORS friction.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 6, React Router DOM 6, Axios, Vanilla CSS Design System |
| **Backend** | Node.js (v20+), Express.js 5, Passport.js, express-session, Joi |
| **Database** | MongoDB (Atlas / Local), Mongoose ODM 8, connect-mongo |
| **AI Integration** | Google Gemini Generative AI SDK (`@google/generative-ai`) |
| **Cloud & Media** | Cloudinary (Image storage), Multer |
| **DevOps & Containers** | Docker, Docker Compose, Nginx |

---

## 🏗️ System & Transaction Architecture

```
                      Browser Client
          ┌───────────────────────────────────┐
          │   Local:  http://localhost:5173   │
          │   Docker: http://localhost:80     │
          └─────────────────┬─────────────────┘
                            │
              Static Assets │ API Proxy (/api/*)
                            ▼
               ┌───────────────────────────┐
               │    Nginx (Alpine) :80     │
               └────────────┬──────────────┘
                            │ (Docker Bridge Network)
                            ▼
               ┌───────────────────────────┐
               │ Express API Server :8080  │
               └────────────┬──────────────┘
                            │
               ACID Multi-Document Session
                            ▼
               ┌───────────────────────────┐
               │    MongoDB Database       │
               │ ├── Listings Collection   │
               │ ├── Bookings Collection   │
               │ ├── Payments Collection   │
               │ └── Users Collection      │
               └───────────────────────────┘
```

---

## 📂 Project Structure

```
HabiTrek/
├── client/                     # React + Vite frontend application
│   ├── public/                 # Static assets & favicon
│   ├── src/
│   │   ├── api/                # Axios instance with response interceptors
│   │   ├── components/         # Navbar, Footer, Flash messages, ReviewCard
│   │   ├── context/            # AuthContext (user state & flash notifications)
│   │   ├── pages/              # ListingShow, ListingsIndex, Payment, BookingsList, etc.
│   │   ├── App.jsx             # Route definitions & layout wrapper
│   │   ├── index.css           # Global design tokens, themes & animations
│   │   └── main.jsx            # React root mount
│   ├── Dockerfile              # Multi-stage build (Vite build -> Nginx Alpine)
│   ├── nginx.conf              # Nginx SPA fallback + /api/ reverse proxy
│   └── vite.config.js          # Vite configuration & dev proxy
├── server/                     # Express.js REST API
│   ├── controllers/            # Route controllers (listing, booking, review, user, ai)
│   ├── models/                 # Mongoose schemas (listing, booking, payment, user, review)
│   ├── routes/                 # Express route definitions
│   ├── utils/                  # ExpressError, wrapAsync helper, sample data
│   ├── middleware.js           # Auth & ownership verification middleware
│   ├── schema.js               # Joi request validation schemas
│   ├── cloudConfig.js          # Cloudinary configuration
│   ├── app.js                  # Express application entry point
│   └── Dockerfile              # Production Node 20 Alpine container definition
├── docker-compose.yml          # Container orchestration for frontend & backend
├── .dockerignore               # Global docker ignore rules
└── README.md                   # Project documentation
```

---

## ⚙️ Environment Variables

Create a `.env` file in the `server/` directory:

```env
# Database connection
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/HabiTrek?retryWrites=true&w=majority

# Server configuration
PORT=8080
SECRET=your_super_secret_session_key
NODE_ENV=development

# Cloudinary credentials (for image uploads)
CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret

# AI Utilities (Google Gemini API Key)
GEMINI_API_KEY=your_gemini_api_key

# Geolocation / Mapping API Key (optional)
MAP_API_KEY=your_map_api_key

# Client Origin (CORS whitelist for production)
CLIENT_ORIGIN=http://localhost:5173,http://localhost:80
```

---

## 🚀 Quick Start Guide

### Option A: Running with Docker (Recommended)

Make sure [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/) are installed on your machine.

1. **Build and start the containers:**
   ```bash
   docker compose up -d --build
   ```

2. **Access the application:**
   - **Frontend App:** [http://localhost](http://localhost) (port 80)
   - **Backend API:** [http://localhost:8080/api](http://localhost:8080/api)

3. **Manage the containers:**
   ```bash
   # View streaming logs
   docker compose logs -f

   # View backend logs only
   docker compose logs -f backend

   # Stop the containers
   docker compose down
   ```

---

### Option B: Running Locally (Development)

#### 1. Start the Backend API
```bash
cd server
npm install
npm run dev
```
*The Express server will start on `http://localhost:8080`.*

#### 2. Start the Frontend Client
In a new terminal:
```bash
cd client
npm install
npm run dev
```
*The Vite development server will start on `http://localhost:5173`.*

---

## 📡 API Documentation

### 🔐 Authentication (`/api`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/signup` | Register a new user account | No |
| `POST` | `/api/login` | Authenticate and create a session | No |
| `GET` | `/api/logout` | Destroy session and log out | Yes |
| `GET` | `/api/current-user` | Retrieve logged-in user profile | No |

### 🏡 Listings (`/api/listings`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/listings` | Fetch all active listings | No |
| `POST` | `/api/listings` | Create a new stay (supports image upload) | Yes |
| `GET` | `/api/listings/:id` | Fetch stay details, reviews, and host | No |
| `PUT` | `/api/listings/:id` | Update stay details (owner only) | Yes |
| `DELETE` | `/api/listings/:id` | Delete stay and cascade reviews (owner only) | Yes |

### 💳 Bookings & Payments (`/api/bookings`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/bookings` | Reserve a stay (server calculates total & validates dates) | Yes |
| `GET` | `/api/bookings` | Retrieve user booking history | Yes |
| `GET` | `/api/bookings/:id` | Retrieve specific reservation details | Yes |
| `POST` | `/api/bookings/:id/pay` | **ACID atomic payment execution & ledger creation** | Yes |
| `GET` | `/api/bookings/:id/receipt`| Get payment invoice & transaction details | Yes |

### ⭐ Reviews (`/api/listings/:id/reviews`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/listings/:id/reviews` | Post a rating and review | Yes |
| `DELETE` | `/api/listings/:id/reviews/:reviewId` | Delete a review (author only) | Yes |

### 🤖 AI Utilities (`/api/ai`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/ai/chat` | Send prompt to Gemini AI assistant for recommendations | No |

---

## 🛡️ ACID Payment Verification

The reservation and payment module was audited and implemented to meet strict financial transaction requirements:

```javascript
// Atomically execute payment and record in the ledger
const session = await mongoose.startSession();
session.startTransaction();
try {
  // 1. Snapshot conflict check to prevent double bookings
  const conflict = await Booking.findOne({
    listing: targetBooking.listing._id,
    status: 'Confirmed',
    startDate: { $lt: targetBooking.endDate },
    endDate: { $gt: targetBooking.startDate }
  }).session(session);

  if (conflict) throw new Error('Selected dates are already booked.');

  // 2. Atomic Compare-And-Swap (CAS) update
  const updatedBooking = await Booking.findOneAndUpdate(
    { _id: bookingId, user: req.user._id, status: 'Pending' },
    { $set: { status: 'Confirmed', transactionId, paymentMethod, paidAt: new Date() } },
    { new: true, session }
  );

  // 3. Immutable audit ledger entry
  const paymentDoc = new Payment({
    booking: updatedBooking._id,
    user: req.user._id,
    listing: updatedBooking.listing,
    amount: updatedBooking.totalPrice,
    transactionId,
    paymentMethod,
    status: 'Success'
  });
  await paymentDoc.save({ session });

  await session.commitTransaction();
} catch (err) {
  await session.abortTransaction();
  throw err;
} finally {
  session.endSession();
}
```

---

## 🤝 Contributing & License

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/amazing-feature`.
3. Commit your changes: `git commit -m 'Add amazing feature'`.
4. Push to the branch: `git push origin feature/amazing-feature`.
5. Open a Pull Request.

Distributed under the **MIT License**. See `LICENSE` for details.
