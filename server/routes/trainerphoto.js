import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Trainer from '../models/Trainer.js';
import { requireAuth } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

const UPLOAD_DIR = path.join(process.cwd(), 'server', 'uploads', 'trainers');
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only JPG, PNG, and WEBP images are allowed.'));
    }
    cb(null, true);
  },
});

const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 5001}`;

// POST /api/trainers/:id/photo
router.post('/:id/photo', requireAuth, (req, res) => {
  upload.single('photo')(req, res, async (err) => {
    if (err) {
      logger.warn('Trainer photo upload error: ' + (err && err.message));
      return res.status(400).json({ success: false, error: 'Invalid photo upload.' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No photo file received.' });
    }

    try {
      const photoUrl = `${PUBLIC_BASE_URL}/uploads/trainers/${req.file.filename}`;

      const trainer = await Trainer.findByIdAndUpdate(
        req.params.id,
        { photoUrl },
        { new: true }
      ).select('-password');

      if (!trainer) {
        // Clean up the orphaned file if the trainer doesn't exist
        fs.unlink(req.file.path, () => {});
        return res.status(404).json({ success: false, error: 'Trainer not found.' });
      }

      res.json({ success: true, photoUrl, trainer });
    } catch (dbErr) {
      logger.error('Photo DB update error: ' + (dbErr && dbErr.message));
      // Clean up file
      try { fs.unlinkSync(req.file.path); } catch (e) {}
      res.status(500).json({ success: false, error: 'Failed to save photo.' });
    }
  });
});

export default router;
