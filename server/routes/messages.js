import express from 'express';
import Message from '../models/Message.js';
import Trainer from '../models/Trainer.js'; // 🔑 Import Trainer model to fetch real names
import { requireAuth, isPairMember } from '../middleware/auth.js';
import { emitToPair } from '../sockets/index.js';
import logger from '../utils/logger.js';

const router = express.Router();
router.use(requireAuth);

// 📍 GET: Fetch all active client chat conversations for a given trainer
router.get('/conversations/:trainerId', async (req, res) => {
  try {
    const { trainerId } = req.params;
    if (req.user.role === 'trainer' && String(req.user.id) !== trainerId) {
      return res.status(403).json({ success: false, error: "Cannot view another trainer's conversations." });
    }

    // 1. Fetch real trainer document from database to get their actual name
    const trainerDoc = await Trainer.findById(trainerId).select('name');
    const realTrainerName = trainerDoc ? trainerDoc.name : "Assigned Coach";
    const initials = realTrainerName.split(" ").map(n => n[0]).join("").toUpperCase();

    // 2. Aggregate unique clients messaged by this trainer to build the sidebar list
    const messages = await Message.find({ trainerId }).sort({ createdAt: -1 });

    const conversationMap = {};
    messages.forEach(m => {
      if (!conversationMap[m.clientId]) {
        conversationMap[m.clientId] = {
          id: m.clientId,
          trainerId: trainerId,
          name: realTrainerName,           // 🔑 Real database trainer name
          initials: initials,              // 🔑 Real trainer initials
          avatar: m.clientAvatar || "CL",
          preview: m.text,
          time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unread: m.sender === 'client' && m.unread ? 1 : 0
        };
      }
    });

    const conversations = Object.values(conversationMap);
    return res.status(200).json({ success: true, conversations });
  } catch (err) {
    logger.error({ msg: 'Fetch Conversations Error', err: err.message });
    return res.status(500).json({ success: false, error: 'Server error while fetching conversations.' });
  }
});

// 📍 GET: Fetch full message thread between trainer and a specific client
router.get('/thread', async (req, res) => {
  try {
    const { trainerId, clientId } = req.query;

    if (!trainerId || !clientId) {
      return res.status(400).json({ success: false, error: 'trainerId and clientId are required.' });
    }
    if (!isPairMember(req, trainerId, clientId)) {
      return res.status(403).json({ success: false, error: 'Not part of this conversation.' });
    }

    const thread = await Message.find({ trainerId, clientId }).sort({ createdAt: 1 });

    const formattedThread = thread.map(m => ({
      from: m.sender,
      text: m.text,
      time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

    return res.status(200).json({ success: true, messages: formattedThread });
  } catch (err) {
    logger.error({ msg: 'Fetch Thread Error', err: err.message });
    return res.status(500).json({ success: false, error: 'Server error while fetching message thread.' });
  }
});

// 📍 POST: Send a new message
router.post('/send', async (req, res) => {
  try {
    const { trainerId, clientId, clientName, clientAvatar, text } = req.body;
    const sender = req.user.role; // trust the token, never the body — stops sender spoofing

    if (!trainerId || !clientId || !text) {
      return res.status(400).json({ success: false, error: 'Missing required message fields.' });
    }
    if (!isPairMember(req, trainerId, clientId)) {
      return res.status(403).json({ success: false, error: 'Not part of this conversation.' });
    }

    const newMessage = new Message({
      trainerId,
      clientId,
      clientName: clientName || "Client",
      clientAvatar: clientAvatar || "CL",
      sender,
      text,
      unread: sender === 'client'
    });

    await newMessage.save();

    // 🔑 FIX: include trainerId/clientId in the payload so recipients can
    // route the incoming message to the correct conversation thread.
    emitToPair(trainerId, clientId, 'message:new', {
      trainerId,
      clientId,
      from: sender,
      text,
      time: 'Just now'
    });

    return res.status(201).json({
      success: true,
      message: {
        from: sender,
        text,
        time: 'Just now'
      }
    });
  } catch (err) {
    logger.error({ msg: 'Send Message Error', err: err.message });
    return res.status(500).json({ success: false, error: 'Server error while sending message.' });
  }
});

export default router;
