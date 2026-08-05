// server/config/trainerDb.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Define a separate URI or database name for trainers
const TRAINER_DB_URI = process.env.TRAINER_MONGO_URI || process.env.MONGODB_URI?.replace(/\/[^/?]+(\?|$)/, '/repups_trainers$1') || 'mongodb://127.0.0.1:27017/repups_trainers';

const trainerConnection = mongoose.createConnection(TRAINER_DB_URI);

trainerConnection.on('connected', () => {
  console.log('🟢 Connected to dedicated TRAINER database successfully.');
});

trainerConnection.on('error', (err) => {
  console.error('❌ Trainer Database Connection Error:', err);
});

// 🔑 CRITICAL: Must export as default so Trainer.js can import it successfully
export default trainerConnection;