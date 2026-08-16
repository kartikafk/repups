import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import helmet from 'helmet';

// Routers
import sessionsRouter from './routes/sessions.js';
import authRouter from './routes/auth.js'; 
import postureRouter from './routes/posture.js';
import trainerAuthRouter from './routes/trainerAuth.js'; // Trainer auth & profile routes
import messagesRouter from './routes/messages.js';       // 👈 Import the messaging router
import bookingsRouter from './routes/bookings.js';     // 👈 Import the new bookings router
import { initSockets } from './sockets/index.js';      // 👈 Import socket initializer
import communityRouter from './routes/community.js';
import adminRouter from './routes/admin.js';
import featuresRouter from './routes/features.js';
import aiCoachRouter from './routes/aiCoach.js';
import logger from './utils/logger.js';
import { startMlSchedule } from './jobs/mlSchedule.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: '*' } });
initSockets(io);

// Security middleware
app.use(helmet());

// Middleware
const configuredOrigins = process.env.CLIENT_ORIGIN
  ?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = configuredOrigins?.length
  ? configuredOrigins
  : (process.env.NODE_ENV === 'production' ? [] : ['http://localhost:5173']);

if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
  logger.error('FATAL: CLIENT_ORIGIN must be set in production');
  process.exit(1);
}
app.use(cors({
  origin(origin, callback) {
    // Requests without an Origin header (such as curl or server-to-server calls)
    // do not need CORS validation.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true,
}));

// Increased payload limits to handle camera snapshot frames & video data cleanly
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use("/uploads", express.static("uploads"));

// Health Check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// API Routes
app.use('/api/sessions', sessionsRouter);
app.use('/api/auth', authRouter); 
app.use('/api/posture', postureRouter);
app.use('/api/trainers', trainerAuthRouter); 
app.use('/api/messages', messagesRouter); 
app.use('/api', bookingsRouter); 
app.use('/api/community', communityRouter);// 👈 Mount bookings routes (e.g., /api/trainers/:trainerId/slots, /api/bookings)
app.use('/api/admin', adminRouter);
app.use('/api', featuresRouter);
app.use('/api/ai-coach', aiCoachRouter);

const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI;

if (process.env.NODE_ENV === 'production' && !MONGODB_URI) {
  logger.error('FATAL: MONGODB_URI must be set in production');
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI || 'mongodb://127.0.0.1:27017/formcoach')
  .then(() => {
    startMlSchedule();
    logger.info('✅ MongoDB connected successfully (Client / Primary DB)');
    server.listen(PORT, () => logger.info(`🚀 RepUps API running on port ${PORT}`));
  })
  .catch((err) => {
    logger.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
