import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    // Authentication & Core Info
    role: {
      type: String,
      enum: ["trainer", "client"],
      required: true,
      default: "client",
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },

    // Trainer Specific Fields
    gym: {
      type: String,
      default: "",
    },
    experience: {
      type: String,
      default: "",
    },
    specialties: [
      {
        type: String,
      },
    ],

    // Client / Athlete Specific Fields
    weight: {
      type: Number,
      default: null,
    },
    height: {
      type: Number,
      default: null,
    },
    age: {
      type: Number,
      default: null,
    },
    fitnessLevel: {
      type: String,
      default: "",
    },
    goal: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);