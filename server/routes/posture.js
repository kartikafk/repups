import express from 'express';
import PostureRecord from '../models/PostureRecord.js';
import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const router = express.Router();

// 1. SAVE POSTURE REPORT
router.post('/save', async (req, res) => {
  try {
    const { profileId, overallScore, generatedAt, planes, findings, recommendations, heightInches, images } = req.body;

    if (!profileId) {
      return res.status(400).json({ success: false, error: 'Missing profileId' });
    }

    const newRecord = new PostureRecord({
      profileId,
      overallScore,
      generatedAt: generatedAt || new Date(),
      planes,
      findings,
      recommendations,
      heightInches,
      images
    });

    await newRecord.save();
    return res.status(201).json({ success: true, message: 'Posture record saved successfully.' });
  } catch (err) {
    logger.error('Posture Save Error: ' + (err && err.message));
    return res.status(500).json({ success: false, error: 'Internal server error while saving posture report.' });
  }
});

// 2. FETCH LATEST POSTURE REPORT (With Fallback for ID mismatches)
router.get('/:profileId/latest', async (req, res) => {
  try {
    const { profileId } = req.params;

    let query = {};
    if (profileId && profileId !== 'undefined' && profileId !== 'null') {
      if (mongoose.Types.ObjectId.isValid(profileId)) {
        query = { $or: [{ profileId }, { _id: profileId }] };
      } else {
        query = { profileId };
      }
    }
    
    // Try finding by the provided profile ID first
    let record = await PostureRecord.findOne(query)
      .sort({ createdAt: -1 })
      .select('-images');

    // 🛡️ Fallback: If no record matches the exact ID string, grab the absolute latest assessment in the DB
    if (!record) {
      record = await PostureRecord.findOne({})
        .sort({ createdAt: -1 })
        .select('-images');
    }

    if (!record) {
      return res.status(404).json({ success: false, error: 'No posture assessment found.' });
    }

    return res.status(200).json({ success: true, record });
  } catch (err) {
    logger.error('Posture Fetch Error: ' + (err && err.message));
    return res.status(500).json({ success: false, error: 'Server error while fetching posture record.' });
  }
});

export default router;
