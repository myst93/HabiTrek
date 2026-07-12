# HabiTrek

A full-stack vacation-rental app (React + Node/Express + MongoDB) with listings, bookings, reviews, authentication, wishlist and basic AI utilities.
  
## Features
- User authentication (signup / login)
- Listings: create, edit, view, delete
- Bookings management
- Reviews and ratings
- Wishlist
- Simple AI helper endpoints (see server/controllers/ai.js)

## Tech stack
- Frontend: React (Vite)
- Backend: Node.js, Express
- Database: MongoDB
- File uploads / images: Cloudinary (optional)

## Repo layout
- client — React app (Vite) with pages and components
  - client/src/pages — UI pages (listings, login, signup, bookings, wishlist)
  - client/src/api/api.js — client API helpers
- server — Express API and controllers
  - server/app.js — Express app entry
  - server/routes — route definitions (listing.js, booking.js, user.js, review.js, ai.js)
  - server/controllers — request handlers
  - server/models — Mongoose models

## Prerequisites
- Node.js (16+ recommended)
- npm or yarn
- MongoDB (local or Atlas)
- Optional: Cloudinary account for image uploads
- Optional: OpenAI API key if AI features are used

## Environment variables
Create a `.env` file in `server/` with values for at least:

- `MONGODB_URI` — MongoDB connection string
- `PORT` — server port (e.g., 3000)
- `SESSION_SECRET` — session/cookie secret
- `CLOUDINARY_CLOUD_NAME` — Cloudinary name (optional)
- `CLOUDINARY_KEY` — Cloudinary API key (optional)
- `CLOUDINARY_SECRET` — Cloudinary API secret (optional)
- `OPENAI_API_KEY` — OpenAI key for AI endpoints (optional)

## Quick start (development)

1) Install and run the server

```bash
cd server
npm install
# Create .env with the variables above
npm run dev # or `node app.js` depending on scripts
```

2) Install and run the client

```bash
cd client
npm install
npm run dev
# open http://localhost:5173 (default Vite port)
```

3) Open the app in your browser and use the UI to create accounts, listings and bookings.

If you prefer running both in one terminal, open two terminals (one `server`, one `client`) and start each.

## API overview
Check the route files in `server/routes` for the current endpoints. Major routes include:

- `POST /users/signup`, `POST /users/login` — authentication
- `GET/POST/PUT/DELETE /listings` — listing CRUD
- `POST /bookings` — create bookings
- `POST /reviews` — add reviews
- `POST /ai/*` — AI-related helper endpoints

## Notes & tips
- If images are stored with Cloudinary, set the Cloudinary env vars and ensure upload configuration in `server/cloudConfig.js`.
- If you use MongoDB Atlas, ensure your IP whitelist and connection string are correct.

## Contributing
- Fork, create a branch, open a PR. Keep changes focused and include tests where appropriate.

## License
MIT
