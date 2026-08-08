// Add this route to your existing trainers router (wherever
// PUT /api/trainers/:id already lives).
//
// npm install multer   (if you don't already have it)
//
// Design choice: photos are stored on local disk for now and served as
// static files. The frontend only ever receives a full `photoUrl` string —
// it has no idea photos live on disk. That means if you later move to S3,
// Cloudinary, etc., you ONLY change this file (swap the storage engine and
// how photoUrl is built) — the React code never has to change.

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Trainer = require("../models/Trainer"); // adjust to your actual model path

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "trainers");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.params.id}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB — keep in sync with frontend check
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, and WEBP images are allowed."));
    }
    cb(null, true);
  },
});

// Set this env var per-environment (localhost in dev, your real domain in
// prod). The route logic itself never changes between environments.
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || "http://localhost:5001";

// POST /api/trainers/:id/photo
router.post("/:id/photo", (req, res) => {
  upload.single("photo")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No photo file received." });
    }

    try {
      const photoUrl = `${PUBLIC_BASE_URL}/uploads/trainers/${req.file.filename}`;

      const trainer = await Trainer.findByIdAndUpdate(
        req.params.id,
        { photoUrl },
        { new: true }
      );

      if (!trainer) {
        // Clean up the orphaned file if the trainer doesn't exist
        fs.unlink(req.file.path, () => {});
        return res.status(404).json({ success: false, error: "Trainer not found." });
      }

      res.json({ success: true, photoUrl, trainer });
    } catch (dbErr) {
      console.error("Photo DB update error:", dbErr);
      res.status(500).json({ success: false, error: "Failed to save photo." });
    }
  });
});

module.exports = router;