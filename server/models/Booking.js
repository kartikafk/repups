import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema(
  {
    trainerId: { type: mongoose.Schema.Types.ObjectId, ref: "Trainer", required: true, index: true },
    clientId: { type: String, required: true, index: true },
    slotTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ["scheduled", "live", "completed", "cancelled"],
      default: "scheduled",
    },
    callRoomId: { type: String, default: null },
  },
  { timestamps: true }
);

BookingSchema.index({ trainerId: 1, clientId: 1, slotTime: 1 });

export default mongoose.model("Booking", BookingSchema);