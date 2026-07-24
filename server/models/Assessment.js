import mongoose from 'mongoose';

export const RETENTION_HOURS = 360; // strict 15-day retention

const assessmentSchema = new mongoose.Schema({
  // Optional — only set if you wire this to your auth/user system.
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false, index: true },

  exercise: { type: String, required: true },

  // Lightweight stats only — no video, no per-rep detail, so this
  // collection stays tiny no matter how many sets get logged.
  avgScore: Number,
repCount: Number,
avgRom: Number,
consistency: Number,

videoUrl: {
    type: String,
    default: null
},  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }
});

// TTL index: MongoDB's own background task (runs roughly every 60s)
// deletes documents once `expiresAt` has passed — enforced by the
// database itself, independent of whether any client ever opens the app
// again. expireAfterSeconds: 0 means "delete at the exact expiresAt value
// stored on the document" rather than N seconds after some other field.
assessmentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Assessment = mongoose.model('Assessment', assessmentSchema);

export default Assessment;