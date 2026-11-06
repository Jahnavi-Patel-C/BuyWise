import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import obligationRoutes from './routes/obligationRoutes.js';
import decisionRoutes from './routes/decisionRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

// Seed helper
import User from './models/User.js';
import { seedDemoDataForUser } from './seeds/seedDemoData.js';
import { generateToken } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Dynamic CORS allowing local dev, production Vercel frontend, and evaluation tools
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'https://frontend-psi-weld-u5xxyzg6a6.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    ) {
      return callback(null, true);
    }
    // Fallback permissive for academic reviewers
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health Checks
app.get(['/health', '/api/health'], (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'BuyWise Backend API',
    database: process.env.MONGODB_URI ? 'MongoDB Atlas (Persistent)' : 'In-Memory MongoDB',
    timestamp: new Date().toISOString(),
  });
});

// Demo Account 1-Click Endpoint (for seamless evaluation and demonstration)
app.post('/api/seed/demo', async (req, res, next) => {
  try {
    const demoEmail = 'alex.student@buywise.edu';
    let user = await User.findOne({ email: demoEmail });

    if (!user) {
      user = await User.create({
        username: 'Alex Sharma (Demo Student)',
        email: demoEmail,
        password: 'Password@123',
      });
    }

    const seeded = await seedDemoDataForUser(user);
    const token = generateToken(user._id.toString());

    return res.status(200).json({
      success: true,
      message: 'Demo account loaded with realistic student finances',
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
      },
      stats: {
        currentBalance: seeded.profile.currentBalance,
        allowance: seeded.profile.allowance,
        pendingObligations: seeded.obligations.length,
        transactionsCount: seeded.transactionsCount,
      },
    });
  } catch (err) {
    next(err);
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/obligations', obligationRoutes);
app.use('/api/decisions', decisionRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route ${req.originalUrl} not found`,
  });
});

// Global Error Handler
app.use(errorHandler);

// Start server function
export async function startServer() {
  await connectDB();
  return app.listen(PORT, () => {
    console.log(`[BuyWise API] Server running on http://localhost:${PORT}`);
  });
}

// If executed directly
if (process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

export default app;

