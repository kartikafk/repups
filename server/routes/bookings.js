import express from "express";
import Booking from "../models/Booking.js";
import TrainerSlot from "../models/TrainerSlot.js";
import Message from "../models/Message.js";
import { requireAuth, isPairMember } from "../middleware/auth.js";
import { createCallRoom, issueJoinToken } from "../services/videoProvider.js";
import { emitToPair } from "../sockets/index.js";

const router = express.Router();
router.use(requireAuth);

// 📍 GET: open (unbooked, future) slots for a trainer's calendar
router.get("/trainers/:trainerId/slots", async (req, res) => {
  try {
    const { trainerId } = req.params;
    if (req.user.role === "trainer" && String(req.user.id) !== trainerId) {
      return res.status(403).json({ success: false, error: "Cannot view another trainer's calendar." });
    }
    const slots = await TrainerSlot.find({
      trainerId,
      isBooked: false,
      slotTime: { $gt: new Date() },
    }).sort({ slotTime: 1 });
    return res.status(200).json({ success: true, slots });
  } catch (err) {
    console.error("❌ Fetch Slots Error:", err);
    return res.status(500).json({ success: false, error: "Server error while fetching slots." });
  }
});

// 📍 POST: trainer publishes new availability
router.post("/trainers/:trainerId/slots", async (req, res) => {
  try {
    const { trainerId } = req.params;
    if (req.user.role !== "trainer" || String(req.user.id) !== trainerId) {
      return res.status(403).json({ success: false, error: "Only this trainer can edit their calendar." });
    }
    const { slotTimes } = req.body; // array of ISO datetime strings
    if (!Array.isArray(slotTimes) || slotTimes.length === 0) {
      return res.status(400).json({ success: false, error: "slotTimes must be a non-empty array." });
    }

    let inserted = [];
    try {
      inserted = await TrainerSlot.insertMany(
        slotTimes.map((t) => ({ trainerId, slotTime: new Date(t) })),
        { ordered: false }
      );
    } catch (err) {
      // Duplicate slots (already published) are fine to skip — surface whatever did get inserted
      inserted = err.insertedDocs || [];
    }

    return res.status(201).json({ success: true, slots: inserted });
  } catch (err) {
    console.error("❌ Publish Slots Error:", err);
    return res.status(500).json({ success: false, error: "Server error while publishing slots." });
  }
});

// 📍 POST: book an open slot (either side can initiate)
router.post("/bookings", async (req, res) => {
  try {
    const { trainerId, clientId, clientName, slotId } = req.body;
    if (!trainerId || !clientId || !slotId) {
      return res.status(400).json({ success: false, error: "trainerId, clientId and slotId are required." });
    }
    if (!isPairMember(req, trainerId, clientId)) {
      return res.status(403).json({ success: false, error: "Not part of this booking." });
    }

    const slot = await TrainerSlot.findOneAndUpdate(
      { _id: slotId, trainerId, isBooked: false },
      { $set: { isBooked: true } },
      { new: true }
    );
    if (!slot) {
      return res.status(409).json({ success: false, error: "That slot is no longer available." });
    }

    const booking = await Booking.create({ trainerId, clientId, slotTime: slot.slotTime });

    // Drop a booking notice into the existing chat thread so it shows inline,
    // reusing your Message model rather than inventing a second message stream.
    await Message.create({
      trainerId,
      clientId,
      clientName: clientName || "Client",
      sender: req.user.role,
      text: `📅 Video call booked for ${slot.slotTime.toLocaleString()}`,
    });

    emitToPair(trainerId, clientId, "booking:new", booking);
    return res.status(201).json({ success: true, booking });
  } catch (err) {
    console.error("❌ Create Booking Error:", err);
    return res.status(500).json({ success: false, error: "Server error while creating booking." });
  }
});

// 📍 POST: join a call — issues a room token, flips status to 'live' on first join
router.post("/bookings/:bookingId/join", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking || !isPairMember(req, booking.trainerId, booking.clientId)) {
      return res.status(404).json({ success: false, error: "Booking not found." });
    }

    if (!booking.callRoomId) {
      const room = await createCallRoom(booking._id);
      booking.callRoomId = room.id;
      booking.status = "live";
      await booking.save();
      emitToPair(booking.trainerId, booking.clientId, "booking:status", {
        bookingId: booking._id,
        status: "live",
      });
    }

    const token = await issueJoinToken(booking.callRoomId, req.user);
    return res.status(200).json({
      success: true,
      roomUrl: token.roomUrl,
      token: token.value,
      status: booking.status,
    });
  } catch (err) {
    console.error("❌ Join Booking Error:", err);
    return res.status(500).json({ success: false, error: "Server error while joining call." });
  }
});

// 📍 PATCH: cancel a booking and free its slot
router.patch("/bookings/:bookingId/cancel", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking || !isPairMember(req, booking.trainerId, booking.clientId)) {
      return res.status(404).json({ success: false, error: "Booking not found." });
    }

    booking.status = "cancelled";
    await booking.save();
    await TrainerSlot.updateOne(
      { trainerId: booking.trainerId, slotTime: booking.slotTime },
      { $set: { isBooked: false } }
    );

    emitToPair(booking.trainerId, booking.clientId, "booking:status", {
      bookingId: booking._id,
      status: "cancelled",
    });
    return res.status(200).json({ success: true, status: "cancelled" });
  } catch (err) {
    console.error("❌ Cancel Booking Error:", err);
    return res.status(500).json({ success: false, error: "Server error while cancelling booking." });
  }
});

export default router;