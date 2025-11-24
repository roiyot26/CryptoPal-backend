import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/database.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import newsRoutes from './routes/news.js';
import pricesRoutes from './routes/prices.js';
import aiRoutes from './routes/ai.js';
import voteRoutes from './routes/votes.js';
import memeRoutes from './routes/memes.js';

dotenv.config();
connectDB();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      // Allow Vercel preview and production URLs
      /^https:\/\/.*\.vercel\.app$/,
    ];
    
    if (allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') return origin === allowed;
      if (allowed instanceof RegExp) return allowed.test(origin);
      return false;
    })) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};
 
app.use(cors(corsOptions));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/prices', pricesRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/memes', memeRoutes);

const staticDir = path.join(__dirname, '..', 'public');
app.use(express.static(staticDir));
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
  });
});

app.use(errorHandler);

export default app;

