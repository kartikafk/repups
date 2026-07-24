import mongoose from 'mongoose';

const RepSchema = new mongoose.Schema(
  {
    n: Number,
    ecc: Number,    // eccentric phase duration, ms
    pause: Number,  // pause/bottom phase duration, ms
    con: Number,    // concentric phase duration, ms
    rom: Number,    // range of motion achieved, degrees
    score: Number,  // 0-100 for this rep
    flags: [String] // form issues detected on this rep
  },
  { _id: false }
);

const SessionSchema = new mongoose.Schema(
  {
    exercise: { type: String, required: true }, // squat | pushup | curl | lunge
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
