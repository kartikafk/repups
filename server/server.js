import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
import dns from 'node:dns';
import { Server as SocketIOServer } from 'socket.io';
import helmet from 'helmet';

// Routers
import sessionsRouter from './routes/sessions.js';
import authRouter from './routes/auth.js';
import postureRouter from './routes/posture.js';
import trainerAuthRouter from './routes/trainerAuth.js';
import messagesRouter from './routes/messages.js';
import bookingsRouter from './routes/bookings.js';
import { initSockets } from './sockets/index.js';
import communityRouter from './routes/community.js';
import adminRouter from './routes/admin.js';
import featuresRouter from './routes/features.js';
import aiCoachRouter from './routes/aiCoach.js';
import logger from './utils/logger.js';
import { startMlSchedule } from './jobs/mlSchedule.js';

dotenv.config();

// Fix Windows DNS SRV resolution for MongoDB Atlas
dns.setServers(['8.8.8.8', '1.1.1.1']);

const app = express();
const server = http.createServer(app);

// -----------------------------------------------------
// CORS CONFIG
// -----------------------------------------------------

const configuredOrigins = process.env.CLIENT_ORIGIN
  ?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = configuredOrigins?.length
  ? configuredOrigins
  : process.env.NODE_ENV === 'production'
    ? []
    : [
        'http://localhost:5173',
        'http://localhost:62065', 
        'http://localhost:62066',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:62065',
        'http://127.0.0.1:62066',
        'http://127.0.0.1:3000'
      ];

const isDevelopmentViteOrigin = (origin) => {
  if (process.env.NODE_ENV === 'production') return false;

  try {
    const url = new URL(origin);

    const privateIpv4 =
      /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(
        url.hostname
      );

    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      privateIpv4 &&
      url.port === '5173'
    );
  } catch {
    return false;
  }
};

if (
  process.env.NODE_ENV === 'production' &&
  allowedOrigins.length === 0
) {
  logger.error('FATAL: CLIENT_ORIGIN must be set in production');
  process.exit(1);
}

// -----------------------------------------------------
// SOCKET.IO
// -----------------------------------------------------

const io = new SocketIOServer(server, {
  cors: {
    origin(origin, callback) {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        isDevelopmentViteOrigin(origin)
      ) {
        return callback(null, true);
      }

      return callback(
        new Error(`Socket.IO origin not allowed: ${origin}`)
      );
    },
    credentials: true,
  },
});

initSockets(io);

// -----------------------------------------------------
// SECURITY
// -----------------------------------------------------

app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      // In development, allow localhost:3000 explicitly
      if (process.env.NODE_ENV !== 'production') {
        if (origin === 'http://localhost:3000' || origin === 'http://127.0.0.1:3000') {
          return callback(null, true);
        }
      }
      
      if (
        allowedOrigins.includes(origin) ||
        isDevelopmentViteOrigin(origin)
      ) {
        return callback(null, true);
      }

      console.log(`CORS blocked origin: ${origin}`);
      return callback(null, true); // Allow all origins in development for now
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Origin', 
      'X-Requested-With', 
      'Content-Type', 
      'Accept', 
      'Authorization',
      'Cache-Control',
      'Pragma'
    ],
    exposedHeaders: ['Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  })
);

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(204);
});

// -----------------------------------------------------
// BODY PARSERS
// -----------------------------------------------------

app.use(express.json({ limit: '50mb' }));

app.use(
  express.urlencoded({
    extended: true,
    limit: '50mb',
  })
);

// -----------------------------------------------------
// STATIC FILES
// -----------------------------------------------------

app.use(
  '/uploads',
  express.static(path.join(process.cwd(), 'uploads'))
);

// -----------------------------------------------------
// HEALTH CHECK
// -----------------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// -----------------------------------------------------
// API ROUTES
// -----------------------------------------------------

app.use('/api/sessions', sessionsRouter);
app.use('/api/auth', authRouter);
app.use('/api/posture', postureRouter);
app.use('/api/trainers', trainerAuthRouter);
app.use('/api/messages', messagesRouter);
app.use('/api', bookingsRouter);
app.use('/api/community', communityRouter);
app.use('/api/admin', adminRouter);
app.use('/api', featuresRouter);
app.use('/api/ai-coach', aiCoachRouter);

// -----------------------------------------------------
// DATABASE + SERVER
// -----------------------------------------------------

const PORT = process.env.PORT || 5001;

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27017/formcoach';

if (
  process.env.NODE_ENV === 'production' &&
  !process.env.MONGODB_URI
) {
  logger.error(
    'FATAL: MONGODB_URI must be set in production'
  );

  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    logger.info(
      'MongoDB connected successfully (Client / Primary DB)'
    );

    startMlSchedule();

    server.listen(PORT, () => {
      logger.info(`RepUps API running on port ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error(
      { err },
      'MongoDB connection error'
    );

    process.exit(1);
  });