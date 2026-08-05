import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer', required: true, index: true },
  clientId: { type: String, required: true, index: true }, // Can be ObjectId or string ID
  clientName: { type: String, required: true },
  clientAvatar: { type: String, default: "CL" },
  sender: { type: String, enum: ['trainer', 'client'], required: true },
  text: { type: String, required: true },
  unread: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Message', MessageSchema);