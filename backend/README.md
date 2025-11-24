# CryptoPal Backend API

Node.js/Express backend with MongoDB and JWT authentication.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the backend directory (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update `.env` with your configuration (see **Environment Variables** below for the full list).

4. Make sure MongoDB is running locally or update `MONGODB_URI` to your MongoDB instance.

5. Start the development server:
```bash
npm run dev
```

The server will run on `http://localhost:5000` by default.

## Environment Variables

Both local and hosted environments use the following variables (see `.env.example` for placeholders):

- `NODE_ENV`
- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `FRONTEND_URL`
- `COINGECKO_API_KEY`
- `CRYPTOPANIC_API_KEY`
- `OPENROUTER_API_KEY`
- `MEME_API_KEY`

Provide real credentials for production (Mongo Atlas URI, API tokens, etc.).

## Deploying to Vercel

1. The repo root contains a `package.json` with a `vercel-build` script that installs/builds the frontend before installing backend dependencies. Vercel runs this automatically.
2. `vercel.json` rewrites every request to `api/index.js`, which exports the Express app from `backend/src/app.js`, enabling both `/api/*` routes and static asset serving via the same handler.
3. Configure all environment variables listed above inside the Vercel dashboard (`FRONTEND_URL` should equal your deployed domain).
4. Connect the GitHub repo to Vercel and trigger a deploy. Verify everything via `https://<your-app>/api/health` and the root URL.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

### User Preferences
- `GET /api/users/preferences` - Get user preferences (requires auth)
- `PUT /api/users/preferences` - Update user preferences (requires auth)

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js       # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js # Auth logic
│   │   └── userController.js # User preferences logic
│   ├── middleware/
│   │   ├── auth.js           # JWT authentication middleware
│   │   └── errorHandler.js   # Error handling middleware
│   ├── models/
│   │   └── User.js            # User mongoose model
│   ├── routes/
│   │   ├── auth.js           # Auth routes
│   │   └── users.js          # User routes
│   ├── utils/
│   │   ├── jwt.js            # JWT utilities
│   │   └── password.js       # Password hashing utilities
│   └── server.js             # Express server setup
├── .env.example              # Environment variables template
└── package.json
```

