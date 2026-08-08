import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Routers
import sessionsRouter from './routes/sessions.js';
import authRouter from './routes/auth.js'; 
import postureRouter from './routes/posture.js';
import trainerAuthRouter from './routes/trainerAuth.js'; // Trainer auth & profile routes
import messagesRouter from './routes/messages.js';       // 👈 Import the messaging router
import bookingsRouter from './routes/bookings.js';     // 👈 Import the new bookings router
import { initSockets } from './sockets/index.js';      // 👈 Import socket initializer
import communityRouter from './routes/community.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: '*' } });
initSockets(io);

// Middleware
app.use(cors({ 
  origin: '*', // Allows connections from local network devices (like mobile phones testing on your IP)
  credentials: true 
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

const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/formcoach';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully (Client / Primary DB)');
    server.listen(PORT, () => console.log(`🚀 RepUps API running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });