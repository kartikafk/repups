import express from 'express';
import Message from '../models/Message.js';

const router = express.Router();

// 📍 GET: Fetch all active client chat conversations for a given trainer
router.get('/conversations/:trainerId', async (req, res) => {
  try {
    const { trainerId } = req.params;

    // Aggregate unique clients messaged by this trainer to build the sidebar list
    const messages = await Message.find({ trainerId }).sort({ createdAt: -1 });
    
    const conversationMap = {};
    messages.forEach(m => {
      if (!conversationMap[m.clientId]) {
        conversationMap[m.clientId] = {
          id: m.clientId,
          name: m.clientName,
          avatar: m.clientAvatar,
          preview: m.text,
          time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unread: m.sender === 'client' && m.unread ? 1 : 0
        };
      }
    });

    const conversations = Object.values(conversationMap);
    return res.status(200).json({ success: true, conversations });
  } catch (err) {
    console.error('❌ Fetch Conversations Error:', err);
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

    const thread = await Message.find({ trainerId, clientId }).sort({ createdAt: 1 });

    const formattedThread = thread.map(m => ({
      from: m.sender,
      text: m.text,
      time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

    return res.status(200).json({ success: true, messages: formattedThread });
  } catch (err) {
    console.error('❌ Fetch Thread Error:', err);
    return res.status(500).json({ success: false, error: 'Server error while fetching message thread.' });
  }
});

// 📍 POST: Send a new message
router.post('/send', async (req, res) => {
  try {
    const { trainerId, clientId, clientName, clientAvatar, sender, text } = req.body;

    if (!trainerId || !clientId || !text || !sender) {
      return res.status(400).json({ success: false, error: 'Missing required message fields.' });
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

    return res.status(201).json({
      success: true,
      message: {
        from: sender,
        text,
        time: 'Just now'
      }
    });
  } catch (err) {
    console.error('❌ Send Message Error:', err);
    return res.status(500).json({ success: false, error: 'Server error while sending message.' });
  }
});

export default router;