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
});

const friendChallengeSchema = new mongoose.Schema({
  challengerId: { type: mongoose.Schema.Types.ObjectId, ref: "ClientProfile", required: true },
  challengerName: { type: String, required: true },
  recipientUsername: { type: String, required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "ClientProfile", default: null },
  exercise: { type: String, required: true },
  target: { type: String, required: true },
  status: { type: String, enum: ["Pending ⏳", "Accepted 🔥", "Completed 🏆"], default: "Pending ⏳" },
  winnerId: { type: mongoose.Schema.Types.ObjectId, ref: "ClientProfile", default: null },
  createdAt: { type: Date, default: Date.now }
});

export const Post = mongoose.model("Post", postSchema);
export const Challenge = mongoose.model("Challenge", challengeSchema);
export const FriendChallenge = mongoose.model("FriendChallenge", friendChallengeSchema);