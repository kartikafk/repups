import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "ClientProfile", required: true },
  name: { type: String, required: true },
  avatar: { type: String, default: "PT" },
  type: { type: String, enum: ["PR", "streak", "milestone", "workout"], default: "workout" },
  text: { type: String, required: true },
  imageUrl: { type: String, default: null },
  exercise: { type: String, default: null },
  stat: { type: String, default: null },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "ClientProfile" }],
  comments: [{
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "ClientProfile" },
    name: String,
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

const challengeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  desc: { type: String, required: true },
  icon: { type: String, default: "🏋️" },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "ClientProfile" }],
  daysLeft: { type: Number, default: 14 },
  active: { type: Boolean, default: true }
  ,members: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    joinedAt: { type: Date, default: Date.now },
    progress: { type: Number, default: 0 }
  }]
});

// NOTE: status values are now plain strings ("Pending", "Accepted",
// "Completed") with NO emoji baked in. The emoji is purely a UI concern —
// keeping it out of the enum means frontend string comparisons
// (b.status === "Pending") actually work, and you can restyle the badge
// anytime without touching the database.
const friendChallengeSchema = new mongoose.Schema({
  challengerId: { type: mongoose.Schema.Types.ObjectId, ref: "ClientProfile", required: true },
  challengerName: { type: String, required: true },
  recipientUsername: { type: String, required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "ClientProfile", default: null },
  exercise: { type: String, required: true },       // human-readable name, e.g. "Back Squat"
  exerciseKey: { type: String, required: true },     // routing key, e.g. "backSquat" — was missing entirely before
  target: { type: String, required: true },
  status: { type: String, enum: ["Pending", "Accepted", "Declined", "Completed"], default: "Pending" },
  winnerId: { type: mongoose.Schema.Types.ObjectId, ref: "ClientProfile", default: null },
  createdAt: { type: Date, default: Date.now }
});

export const Post = mongoose.model("Post", postSchema);
export const Challenge = mongoose.model("Challenge", challengeSchema);
export const FriendChallenge = mongoose.model("FriendChallenge", friendChallengeSchema);
