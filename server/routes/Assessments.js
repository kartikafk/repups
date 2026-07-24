import express from 'express';
import Assessment, { RETENTION_HOURS } from '../models/Assessment.js';
import upload from '../middleware/upload.js';
const router = express.Router();

// Create a minimal record (stats only — no video) so the server can
// enforce the 360-hour retention window with a MongoDB TTL index,
// independent of the client.
// POST /api/assessments

router.post('/', async (req, res) => {
  try {
    const { exercise, avgScore, repCount, avgRom, consistency, userId } = req.body;

    if (!exercise) {
      return res.status(400).json({ error: 'exercise is required' });
    }

    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + RETENTION_HOURS * 60 * 60 * 1000);

    const record = await Assessment.create({

    exercise,

    avgScore,

    repCount,

    avgRom,

    consistency,

    userId: userId || undefined,

    createdAt,

    expiresAt

});

    res.status(201).json({ id: record._id, expiresAt: record.expiresAt });
  } catch (err) {
    console.error('Failed to save assessment record:', err);
    res.status(500).json({ error: 'Failed to save assessment record' });
  }
});
router.post(
    "/upload",
    upload.single("video"),
    async (req, res) => {

        if (!req.file) {
            return res.status(400).json({
                error: "No video uploaded"
            });
        }

        res.json({
            videoUrl:
                `/uploads/${req.file.filename}`
        });

    }
);
// List assessment records — e.g. for an admin panel, or a user's own
// history sync check.
// GET /api/assessments?userId=...
router.get('/', async (req, res) => {
  try {
    const filter = req.query.userId ? { userId: req.query.userId } : {};
    const records = await Assessment.find(filter).sort({ createdAt: -1 });
    res.json(records);
  } catch (err) {
    console.error('Failed to fetch assessment records:', err);
    res.status(500).json({ error: 'Failed to fetch assessment records' });
  }
});

// Check whether a specific assessment has expired. Useful for the client
// to reconcile its local IndexedDB copy against the server's
// authoritative clock next time the app opens.
// GET /api/assessments/:id/status
router.get('/:id/status', async (req, res) => {
  try {
    const record = await Assessment.findById(req.params.id);
    if (!record) {
      // Already swept by MongoDB's TTL index, or never existed.
      return res.json({ expired: true });
    }
    res.json({ expired: record.expiresAt.getTime() <= Date.now(), expiresAt: record.expiresAt });
  } catch (err) {
  console.error("========== ASSESSMENT ERROR ==========");
  console.error(err);
  console.error("Message:", err.message);
  console.error("Stack:", err.stack);

  res.status(500).json({
    error: err.message
  });
}
});

export default router;