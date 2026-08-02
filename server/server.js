import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Routers
import sessionsRouter from './routes/sessions.js';
import authRouter from './routes/auth.js'; 
import postureRouter from './routes/posture.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors({ 
  origin: '*', // Allows connections from local network devices (like phones testing on your IP)
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

const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/formcoach';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    app.listen(PORT, () => console.log(`🚀 RepUps API running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });