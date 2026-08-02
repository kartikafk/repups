import mongoose from 'mongoose';

const RepSchema = new mongoose.Schema(
  {
    n: Number,
    ecc: Number,
    pause: Number,
    con: Number,
    rom: Number,
    score: Number,
    flags: [String]
  },
  { _id: false }
);

const SessionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    exercise: { type: String, required: true }, 
    muscleGroup: { type: String, index: true }, // 🔑 Added to support muscle group dashboards
    setIndex: { type: Number, default: 0, index: true }, 
    date: { type: String, required: true, index: true }, // 'YYYY-MM-DD'
    weight: { type: Number, default: 0 }, 
    youtubeId: { type: String, default: null }, 
    videoUrl: { type: String, default: null }, 
    reps: [RepSchema],
    repCount: { type: Number, required: true },
    avgScore: { type: Number, required: true },
    avgTempo: {
      ecc: Number,
      pause: Number,
      con: Number
    },
    avgRom: Number,
    consistency: Number,
    topIssues: [
      {
        key: String,
        label: String,
        count: Number
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model('Session', SessionSchema);