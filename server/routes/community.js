import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { Post, Challenge, FriendChallenge } from "../models/Community.js";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

// ── Upload setup ────────────────────────────────────────────────────────
// Ensure the uploads folder actually exists (won't error on a fresh clone
// or fresh deploy where the folder was never committed to git).
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`)
});

// Was previously accepting ANY file with no size cap. Now restricted to
// actual images, capped at 8MB, matching what the frontend <input accept>
// already implies (accept="image/*" doesn't actually block anything —
// it's just a picker filter, not real validation).
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, WEBP, or GIF images are allowed."));
    }
    cb(null, true);
  }
});

// Small helper so every route validates authorId/userId the same way
// instead of trusting whatever string the client sends. Blocks the
// "everyone posts as the same fake ID" bleed at the source.
const isValidObjectId = (id) => typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);

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
router.post("/feed", (req, res) => {
  upload.single("image")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }

    try {
      const { name, avatar, type, text, exercise, stat } = req.body;
      const authorId = req.user.id;

      if (!isValidObjectId(authorId)) {
        // Previously this silently fell back to a shared fake ObjectId.
        // Reject instead — the frontend now blocks the request before it
        // gets here too, but the backend should never trust the client.
        if (req.file) fs.unlink(req.file.path, () => {});
        return res.status(401).json({ success: false, error: "Missing or invalid author ID. Please log in again." });
      }
      if (!name || !text?.trim()) {
        if (req.file) fs.unlink(req.file.path, () => {});
        return res.status(400).json({ success: false, error: "Post needs a name and some text." });
      }

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
});

// 3. LIKE / UNLIKE POST
router.post("/feed/:id/like", async (req, res) => {
  try {
    const userId = req.user.id;
    if (!isValidObjectId(userId)) {
      return res.status(401).json({ success: false, error: "Missing or invalid user ID. Please log in again." });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, error: "Post not found" });

    const index = post.likes.findIndex(id => id.toString() === userId);
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
    const { challengerId, challengerName, recipientUsername, exercise, exerciseKey, target } = req.body;

    if (!isValidObjectId(challengerId)) {
      return res.status(401).json({ success: false, error: "Missing or invalid challenger ID. Please log in again." });
    }
    if (!recipientUsername?.trim() || !exercise || !exerciseKey || !target) {
      return res.status(400).json({ success: false, error: "Missing required challenge fields." });
    }

    // The input field is labeled "Friend Name or Email", but this was only
    // ever matching against `name` — so an email address here silently
    // failed to resolve a recipient. Now it matches either field.
    const recipient = await User.findOne({
      $or: [
        { name: { $regex: `^${recipientUsername.trim()}$`, $options: "i" } },
        { email: { $regex: `^${recipientUsername.trim()}$`, $options: "i" } },
      ]
    });

    const newBattle = new FriendChallenge({
      challengerId,
      challengerName,
      recipientUsername: recipientUsername.trim(),
      recipientId: recipient ? recipient._id : null,
      exercise,
      exerciseKey,
      target,
      status: "Pending"
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
    if (!isValidObjectId(userId)) {
      return res.status(401).json({ success: false, error: "Missing or invalid user ID." });
    }

    // recipientId is only set at creation time if the recipient's name or
    // email matched a User document exactly. If it didn't match (wrong
    // case, whitespace, or the recipient signed up after the challenge
    // was sent), recipientId stays null and this user would never see the
    // challenge. So we also look this user up and match by name OR email
    // as a fallback, since the sender could have typed either.
    const requestingUser = await User.findById(userId).select("name email");
    let nameOrEmailMatch = null;
    if (requestingUser) {
      const candidates = [requestingUser.name, requestingUser.email].filter(Boolean);
      nameOrEmailMatch = {
        recipientId: null,
        recipientUsername: { $in: candidates.map(v => new RegExp(`^${v.trim()}$`, "i")) },
      };
    }

    const orConditions = [{ challengerId: userId }, { recipientId: userId }];
    if (nameOrEmailMatch) orConditions.push(nameOrEmailMatch);

    const challenges = await FriendChallenge.find({ $or: orConditions }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, challenges });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. ACCEPT A 1v1 FRIEND CHALLENGE — this route didn't exist before, even
// though the frontend was already calling it. This was the actual reason
// "Accept & Launch" never persisted anything to the database.
router.post("/friend-challenges/:battleId/accept", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!isValidObjectId(userId)) {
      return res.status(401).json({ success: false, error: "Missing or invalid user ID. Please log in again." });
    }

    const battle = await FriendChallenge.findById(req.params.battleId);
    if (!battle) {
      return res.status(404).json({ success: false, error: "Challenge not found." });
    }

    // Re-resolve recipientId at accept-time in case it was null at
    // creation (recipient hadn't been matched yet) but the accepting user
    // genuinely is that recipient, by name OR email — the sender could
    // have typed either into the "Friend Name or Email" field.
    const acceptingUser = await User.findById(userId).select("name email");
    const isRecipientById = battle.recipientId && battle.recipientId.toString() === userId;
    const sentTo = battle.recipientUsername.trim().toLowerCase();
    const isRecipientByName =
      !battle.recipientId &&
      acceptingUser &&
      [acceptingUser.name, acceptingUser.email].filter(Boolean).some(v => v.trim().toLowerCase() === sentTo);

    if (battle.challengerId.toString() === userId) {
      return res.status(403).json({ success: false, error: "You sent this challenge — the recipient needs to accept it, not you." });
    }
    if (!isRecipientById && !isRecipientByName) {
      return res.status(403).json({ success: false, error: `This challenge was sent to "${battle.recipientUsername}", which doesn't match your account.` });
    }

    battle.status = "Accepted";
    if (!battle.recipientId) battle.recipientId = userId;
    await battle.save();

    res.status(200).json({ success: true, challenge: battle });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

// ── Reminder for your main server file ──────────────────────────────────
// Make sure uploaded images are actually servable:
//   app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
// If that line is missing, imageUrl paths returned by this router will
// 404 in the browser even though the files exist on disk.
