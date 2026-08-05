import mongoose from 'mongoose';
import trainerConnection from '../config/trainerDb.js';

const trainerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  password: { type: String, required: true },
  title: { type: String, default: 'Elite Strength & Conditioning Coach' },
  gym: { type: String, default: '' },
  locationName: { type: String, default: 'Mumbai, India' },
  
  // 📍 Real GeoJSON point index for proximity queries
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [72.8777, 19.0760] } // [longitude, latitude]
  },

  experience: { type: String, default: '8 years' },
  languages: { type: String, default: 'English, Hindi' },
  trainingStyle: { type: String, default: 'Evidence-based, corrective' },
  specialties: { type: [String], default: [] },
  bio: { type: String, default: 'Elite strength and corrective exercise coach specializing in building bulletproof movement patterns.' },
  verified: { type: Boolean, default: false },
  rating: { type: Number, default: 4.9 },
  reviewsCount: { type: Number, default: 127 },
  pricing: {
    personalTraining: { type: Number, default: 2500 },
    videoConsultation: { type: Number, default: 1500 },
    workoutProgramming: { type: Number, default: 1000 }
  },
  createdAt: { type: Date, default: Date.now }
});

trainerSchema.index({ location: '2dsphere' });

const Trainer = trainerConnection.model('Trainer', trainerSchema);
export default Trainer;