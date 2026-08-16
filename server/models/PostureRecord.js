import mongoose from 'mongoose';

const postureRecordSchema = new mongoose.Schema({
  profileId: { type: String, required: true, index: true },
  overallScore: { type: Number, required: true },
  generatedAt: { type: Date, default: Date.now },
  planes: {
    front: { score: Number, joints: Array },
    side: { score: Number, joints: Array },
    back: { score: Number, joints: Array },
    transverse: { score: Number, joints: Array }
  },
  findings: [String],
  recommendations: {
    avoid: [String],
    focusOn: [String]
  },
  heightInches: { type: Number, default: null },
  images: {
    front: String,
    side: String,
    back: String
  },
  featureVector: { type: mongoose.Schema.Types.Mixed, default: null },
  baseline: { type: mongoose.Schema.Types.Mixed, default: null },
  ml: { type: mongoose.Schema.Types.Mixed, default: null }
}, { timestamps: true });

export default mongoose.model('PostureRecord', postureRecordSchema);
