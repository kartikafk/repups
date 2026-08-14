import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["admin", "trainer", "client"], required: true, default: "client" },
    accountStatus: { type: String, enum: ["active", "suspended"], default: "active", index: true },
    deletedAt: { type: Date, default: null },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    password: { type: String, required: true },

    // 📍 Real GeoJSON Coordinates [longitude, latitude]
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [72.8777, 19.0760] } // Default Mumbai coordinates
    },

    // Trainer specific fields
    gym: { type: String, default: "" },
    experience: { type: String, default: "" },
    specialties: [{ type: String }],

    // Client specific fields
    weight: { type: Number, default: null },
    height: { type: Number, default: null },
    age: { type: Number, default: null },
    fitnessLevel: { type: String, default: "" },
    goal: { type: String, default: "" },
    phone: { type: String, default: "" },
    photoUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

UserSchema.index({ location: '2dsphere' }); // 👈 Required for distance calculations

export default mongoose.model("User", UserSchema);
