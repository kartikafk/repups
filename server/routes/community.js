import express from "express";
import multer from "multer";
import { Post, Challenge, FriendChallenge } from "../models/Community.js";
import User from "../models/User.js"; // <-- Corrected import matching your User.js file

const router = express.Router();

// Multer storage for global photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// 1. GET GLOBAL COMMUNITY FEED
router.get("/feed", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).limit(50);
    res.status(200).json({ success: true, posts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. CREATE POST (Supports Text + Images)
router.post("/feed", upload.single("image"), async (req, res) => {
  try {
    const { authorId, name, avatar, type, text, exercise, stat } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const newPost = new Post({
      authorId,
      name,
      avatar: avatar || name.slice(0, 2).toUpperCase(),
      type: type || "workout",
      text,
      imageUrl,
      exercise: exercise || null,
      stat: stat || "Update Shared"
    });

    await newPost.save();
    res.status(201).json({ success: true, post: newPost });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. LIKE / UNLIKE POST
router.post("/feed/:id/like", async (req, res) => {
  try {
    const { userId } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, error: "Post not found" });

    const index = post.likes.indexOf(userId);
    if (index > -1) {
      post.likes.splice(index, 1);
    } else {
      post.likes.push(userId);
    }
    await post.save();
    res.status(200).json({ success: true, likesCount: post.likes.length, liked: index === -1 });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. GET GLOBAL LEADERBOARD
router.get("/leaderboard", async (req, res) => {
  try {
    const users = await User.find()
      .sort({ streak: -1 })
      .limit(20)
      .select("name streak");

    const leaderboard = users.map((u, idx) => ({
      rank: idx + 1,
      name: u.name,
      avatar: u.name.slice(0, 2).toUpperCase(),
      xp: 3000 + ((u.streak || 1) * 120),
      streak: u.streak || 10,
    }));

    res.status(200).json({ success: true, leaderboard });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. GET GLOBAL CHALLENGES
router.get("/challenges", async (req, res) => {
  try {
    let challenges = await Challenge.find({ active: true });
    if (challenges.length === 0) {
      challenges = await Challenge.insertMany([
        { title: "30-Day Squat Streak", desc: "Squat every day for 30 days, any variation.", icon: "🏋️", daysLeft: 12 },
        { title: "10K Steps Sprint", desc: "Hit 10,000 steps for 7 consecutive days.", icon: "👟", daysLeft: 4 },
        { title: "Posture Reset", desc: "Complete daily mobility routine for 2 weeks.", icon: "🧘", daysLeft: 9 }
      ]);
    }
    res.status(200).json({ success: true, challenges });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. CREATE 1v1 FRIEND CHALLENGE
router.post("/friend-challenges", async (req, res) => {
  try {
    const { challengerId, challengerName, recipientUsername, exercise, target } = req.body;
    const recipient = await User.findOne({ name: recipientUsername });

    const newBattle = new FriendChallenge({
      challengerId,
      challengerName,
      recipientUsername,
      recipientId: recipient ? recipient._id : null,
      exercise,
      target,
      status: "Pending ⏳"
    });

    await newBattle.save();
    res.status(201).json({ success: true, challenge: newBattle });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. GET 1v1 FRIEND CHALLENGES FOR USER
router.get("/friend-challenges/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const challenges = await FriendChallenge.find({
      $or: [{ challengerId: userId }, { recipientId: userId }]
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, challenges });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;