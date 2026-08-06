import mongoose from "mongoose";
import trainerConnection from "../config/trainerDb.js";

const TrainerSlotSchema = new mongoose.Schema(
  {
    trainerId: { type: mongoose.Schema.Types.ObjectId, ref: "Trainer", required: true, index: true },
    slotTime: { type: Date, required: true },
    isBooked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

TrainerSlotSchema.index({ trainerId: 1, slotTime: 1 }, { unique: true });

const TrainerSlot = trainerConnection.model("TrainerSlot", TrainerSlotSchema);
export default TrainerSlot;