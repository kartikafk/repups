import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import sessionsRouter from './routes/sessions.js';
import assessmentsRouter from './routes/assessments.js';
import path from 'path';

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/sessions', sessionsRouter);
app.use('/api/assessments', assessmentsRouter);

const PORT = 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/formcoach';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`FormCoach API running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });