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

3. Update `.env` with your configuration:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `FRONTEND_URL` - Frontend URL for CORS

4. Make sure MongoDB is running locally or update `MONGODB_URI` to your MongoDB instance.

5. Start the development server:
```bash
npm run dev
```

The server will run on `http://localhost:5000` by default.

## Environment Variables

### Development
- `NODE_ENV=development`
- `PORT=5000`
- `MONGODB_URI=mongodb://localhost:27017/cryptopal`
- `JWT_SECRET=dev-secret-key-change-in-production`
- `JWT_EXPIRES_IN=7d`
- `FRONTEND_URL=http://localhost:5173`

### Production
- `NODE_ENV=production`
- `PORT=5000` (or your production port)
- `MONGODB_URI=your-production-mongodb-uri`
- `JWT_SECRET=your-production-secret-key`
- `JWT_EXPIRES_IN=7d`
- `FRONTEND_URL=your-production-frontend-url`
- `MEME_API_KEY=your-apileague-meme-api-key`

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

