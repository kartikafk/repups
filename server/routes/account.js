import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import User from '../models/User.js';
import Session from '../models/Session.js';
import Message from '../models/Message.js';
import logger from '../utils/logger.js';

const router = express.Router();
router.use(requireAuth);

// DELETE /api/auth/account - delete or anonymize user data
router.delete('/account', async (req, res) => {
  try {
    const userId = req.user.id;
    // Anonymize user (safer than hard delete if referential integrity is needed)
    await User.updateOne({ _id: userId }, {
      $set: { name: 'Deleted User', email: `deleted:${userId}@deleted`, deletedAt: new Date() },
      $unset: { password: '', location: '', gym: '', specialties: '' }
    });
    await Session.deleteMany({ userId });
    await Message.deleteMany({ $or: [{ clientId: userId }, { trainerId: userId }] });
    // TODO: remove uploaded files associated with user
    return res.status(200).json({ success: true, message: 'Account deleted/anonymized.' });
  } catch (err) {
    logger.error({ msg: 'Account deletion failed', err: err.message });
    return res.status(500).json({ success: false, error: 'Server error while deleting account.' });
  }
});

export default router;
