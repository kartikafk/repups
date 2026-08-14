import mongoose from "mongoose";

const trainerClientConnectionSchema = new mongoose.Schema({
  trainerId: { type: String, required: true, index: true },
  clientId: { type: String, required: true, index: true },
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending", index: true },
  respondedAt: { type: Date, default: null },
}, { timestamps: true });

trainerClientConnectionSchema.index({ trainerId: 1, clientId: 1 }, { unique: true });
export const hasAcceptedConnection = (trainerId, clientId) => TrainerClientConnection.exists({ trainerId: String(trainerId), clientId: String(clientId), status: "accepted" });
const TrainerClientConnection = mongoose.model("TrainerClientConnection", trainerClientConnectionSchema);
export default TrainerClientConnection;
