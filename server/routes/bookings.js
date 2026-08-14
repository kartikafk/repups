import express from "express";
import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import TrainerSlot from "../models/TrainerSlot.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { requireAuth, isPairMember } from "../middleware/auth.js";
import { createCallRoom, issueJoinToken } from "../services/videoProvider.js";
import { emitToPair } from "../sockets/index.js";
import { Notification } from "../models/Feature.js";
import { hasAcceptedConnection } from "../models/TrainerClientConnection.js";

const router = express.Router();
router.use(requireAuth);

// The authenticated role determines the only bookings that can be returned.
// A trainer receives their calendar; a client receives only their own sessions.
router.get("/bookings", async (req, res) => {
  try {
    const filter = req.user.role === "trainer" ? { trainerId: req.user.id } : { clientId: req.user.id };
    const bookings = await Booking.find(filter).sort({ slotTime: 1 }).lean();
    const clientIds = [...new Set(bookings.map((booking) => String(booking.clientId)))];
    const clients = await User.find({ _id: { $in: clientIds }, role: "client" }).select("name photoUrl").lean();
    const clientsById = new Map(clients.map((client) => [String(client._id), client]));

    return res.json({
      success: true,
      bookings: bookings.map((booking) => ({
        ...booking,
        scheduledAt: booking.slotTime,
        client: req.user.role === "trainer"
          ? { _id: booking.clientId, name: clientsById.get(String(booking.clientId))?.name || "Client", photoUrl: clientsById.get(String(booking.clientId))?.photoUrl || "" }
          : undefined,
      })),
    });
  } catch (err) {
    console.error("Fetch bookings error:", err);
    return res.status(500).json({ success: false, error: "Unable to load bookings." });
  }
});

// 📍 GET: open (unbooked, future) slots for a trainer's calendar
router.get("/trainers/:trainerId/slots", async (req, res) => {
  try {
    const { trainerId } = req.params;
    if (!mongoose.isValidObjectId(trainerId)) return res.status(400).json({ success: false, error: "Invalid trainer ID." });
    if (req.user.role === "trainer" && String(req.user.id) !== trainerId) {
      return res.status(403).json({ success: false, error: "Cannot view another trainer's calendar." });
    }
    if (req.user.role === "client" && !await hasAcceptedConnection(trainerId, req.user.id)) {
      return res.status(403).json({ success: false, error: "You can only view availability for a connected trainer." });
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

// 📍 GET: all slots (open + booked) for a trainer on one specific day — for the trainer's calendar view
router.get("/trainers/:trainerId/slots/day", async (req, res) => {
  try {
    const { trainerId } = req.params;
    const { date } = req.query; // "YYYY-MM-DD"
    if (!mongoose.isValidObjectId(trainerId)) return res.status(400).json({ success: false, error: "Invalid trainer ID." });
    if (req.user.role !== "trainer" || String(req.user.id) !== trainerId) {
      return res.status(403).json({ success: false, error: "Cannot view another trainer's calendar." });
    }
    if (!date) {
      return res.status(400).json({ success: false, error: "date query param required (YYYY-MM-DD)." });
    }

    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T23:59:59.999`);

    const slots = await TrainerSlot.find({
      trainerId,
      slotTime: { $gte: start, $lte: end },
    }).sort({ slotTime: 1 });

    // TrainerSlot only tracks isBooked — it doesn't reference the Booking doc.
    // Join by trainerId + slotTime to attach bookingId/status for the calendar UI.
    const bookedTimes = slots.filter((s) => s.isBooked).map((s) => s.slotTime);
    let bookingsByTime = {};
    if (bookedTimes.length > 0) {
      const bookings = await Booking.find({
        trainerId,
        slotTime: { $in: bookedTimes },
        status: { $ne: "cancelled" },
      });
      bookingsByTime = Object.fromEntries(bookings.map((b) => [b.slotTime.toISOString(), b]));
    }

    const enriched = slots.map((s) => {
      const booking = bookingsByTime[s.slotTime.toISOString()];
      return {
        _id: s._id,
        slotTime: s.slotTime,
        isBooked: s.isBooked,
        bookingId: booking?._id || null,
        bookingStatus: booking?.status || null, // "scheduled" | "live" | "completed"
        clientId: booking?.clientId || null,
      };
    });

    return res.status(200).json({ success: true, slots: enriched });
  } catch (err) {
    console.error("❌ Fetch Day Slots Error:", err);
    return res.status(500).json({ success: false, error: "Server error while fetching day slots." });
  }
});

// 📍 POST: trainer publishes new availability
router.post("/trainers/:trainerId/slots", async (req, res) => {
  try {
    const { trainerId } = req.params;
    if (!mongoose.isValidObjectId(trainerId)) return res.status(400).json({ success: false, error: "Invalid trainer ID." });
    if (req.user.role !== "trainer" || String(req.user.id) !== trainerId) {
      return res.status(403).json({ success: false, error: "Only this trainer can edit their calendar." });
    }
    const { slotTimes } = req.body; // array of ISO datetime strings
    if (!Array.isArray(slotTimes) || slotTimes.length === 0) {
      return res.status(400).json({ success: false, error: "slotTimes must be a non-empty array." });
    }
    if (slotTimes.length > 100 || slotTimes.some((time) => Number.isNaN(new Date(time).getTime()) || new Date(time) <= new Date())) {
      return res.status(400).json({ success: false, error: "Provide up to 100 valid future slot times." });
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

// Remove an unbooked availability slot. Booked sessions must be cancelled first.
router.delete("/trainers/:trainerId/slots/:slotId", async (req, res) => {
  try {
    const { trainerId, slotId } = req.params;
    if (!mongoose.isValidObjectId(trainerId) || !mongoose.isValidObjectId(slotId)) return res.status(400).json({ success: false, error: "Invalid trainer or slot ID." });
    if (req.user.role !== "trainer" || String(req.user.id) !== trainerId) {
      return res.status(403).json({ success: false, error: "Only this trainer can edit their calendar." });
    }
    const slot = await TrainerSlot.findOneAndDelete({ _id: slotId, trainerId, isBooked: false });
    if (!slot) return res.status(409).json({ success: false, error: "Slot was not found or is already booked." });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Unable to remove this slot." });
  }
});

// 📍 POST: book an open slot (either side can initiate)
router.post("/bookings", async (req, res) => {
  try {
    const { trainerId, clientId, clientName, slotId } = req.body;
    if (!trainerId || !clientId || !slotId) {
      return res.status(400).json({ success: false, error: "trainerId, clientId and slotId are required." });
    }
    if (!mongoose.isValidObjectId(trainerId) || !mongoose.isValidObjectId(slotId)) return res.status(400).json({ success: false, error: "Invalid trainer or slot ID." });
    if (!isPairMember(req, trainerId, clientId)) {
      return res.status(403).json({ success: false, error: "Not part of this booking." });
    }
    if (!await hasAcceptedConnection(trainerId, clientId)) {
      return res.status(403).json({ success: false, error: "A confirmed trainer-client connection is required before booking." });
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

// A trainer confirms only a booking that belongs to their own calendar. The
// confirmation creates a real system message/notification in the existing
// communication channels rather than a parallel appointment chat system.
router.patch("/bookings/:bookingId/confirm", async (req, res) => {
  try {
    if (req.user.role !== "trainer") {
      return res.status(403).json({ success: false, error: "Only trainers can confirm appointments." });
    }
    const booking = await Booking.findOne({ _id: req.params.bookingId, trainerId: req.user.id });
    if (!booking) return res.status(404).json({ success: false, error: "Booking not found." });
    if (booking.status === "cancelled" || booking.status === "completed") {
      return res.status(409).json({ success: false, error: "This appointment cannot be confirmed." });
    }
    booking.status = "confirmed";
    await booking.save();

    const client = await User.findById(booking.clientId).select("name").lean();
    const text = `Your session on ${booking.slotTime.toLocaleString()} has been confirmed. You can now message your trainer and join the video session when it starts.`;
    await Promise.all([
      Message.create({ trainerId: booking.trainerId, clientId: booking.clientId, clientName: client?.name || "Client", sender: "trainer", text }),
      Notification.create({ userId: String(booking.clientId), title: "Session confirmed", body: text, type: "booking" }),
    ]);
    emitToPair(booking.trainerId, booking.clientId, "booking:status", { bookingId: booking._id, status: booking.status });
    return res.json({ success: true, booking });
  } catch (error) {
    console.error("Confirm booking error:", error);
    return res.status(500).json({ success: false, error: "Unable to confirm this appointment." });
  }
});

// 📍 POST: join a call — issues a room token, flips status to 'live' on first join
router.post("/bookings/:bookingId/join", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking || !isPairMember(req, booking.trainerId, booking.clientId)) {
      return res.status(404).json({ success: false, error: "Booking not found." });
    }
    if (!["confirmed", "live"].includes(booking.status)) {
      return res.status(409).json({ success: false, error: "The appointment must be confirmed before joining its video session." });
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
