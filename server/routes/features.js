import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import Razorpay from "razorpay";
import User from "../models/User.js";
import Trainer from "../models/Trainer.js";
import Booking from "../models/Booking.js";
import Session from "../models/Session.js";
import Message from "../models/Message.js";
import PostureRecord from "../models/PostureRecord.js";
import { Notification, WorkoutPlan, Question, Review, Gym, Event, EventRegistration, GymMembership, SavedGym } from "../models/Feature.js";
import TrainerClientConnection, { hasAcceptedConnection } from "../models/TrainerClientConnection.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router(); router.use(requireAuth);
const valid = mongoose.isValidObjectId;
const clientOfTrainer = hasAcceptedConnection;
const uploadDir = path.join(process.cwd(), "uploads", "profiles"); fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ storage: multer.diskStorage({ destination: uploadDir, filename: (_r, f, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(f.originalname).toLowerCase()}`) }), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_r, f, cb) => cb(null, ["image/jpeg", "image/png", "image/webp"].includes(f.mimetype)) });
router.get("/me", async (req, res) => {
  try {
    const model = req.user.role === "trainer" ? Trainer : User;
    const account = await model.findById(req.user.id).select("-password").lean();
    if (!account) return res.status(404).json({ success: false, error: "Account not found." });

    if (req.user.role !== "client") return res.json({ success: true, user: account });

    const [workouts, recentPosture] = await Promise.all([
      Session.countDocuments({ userId: req.user.id }),
      PostureRecord.find({ profileId: req.user.id })
        .sort({ generatedAt: -1, createdAt: -1 })
        .limit(2)
        .select("overallScore generatedAt createdAt")
        .lean(),
    ]);

    const latestScore = recentPosture[0]?.overallScore ?? null;
    const previousScore = recentPosture[1]?.overallScore ?? null;
    const postureChange = latestScore !== null && previousScore !== null ? latestScore - previousScore : null;
    const goals = account.goal ? [{
      title: account.goal,
      subtitle: "Primary fitness goal",
      progress: 0,
      completed: 0,
      total: 1,
      unit: "goal",
    }] : [];

    return res.json({
      success: true,
      user: {
        ...account,
        stats: { workouts, followers: 0, following: 0, postureScore: latestScore, postureChange },
        postureScore: latestScore,
        postureChange,
        goals,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || "Unable to load profile." });
  }
});
router.patch("/me", async (req, res) => {
  try {
    const permitted = ["name", "phone", "age", "weight", "height", "fitnessLevel", "goal", "experience", "gym", "bio", "specialties", "locationName"];
    const updates = Object.fromEntries(Object.entries(req.body || {}).filter(([key]) => permitted.includes(key)));

    if (Object.prototype.hasOwnProperty.call(updates, "name")) {
      updates.name = String(updates.name || "").trim();
      if (!updates.name) return res.status(400).json({ success: false, error: "Name is required." });
    }

    if (Object.prototype.hasOwnProperty.call(updates, "age")) {
      if (updates.age === "" || updates.age === null) updates.age = null;
      else {
        const age = Number(updates.age);
        if (!Number.isInteger(age) || age < 0 || age > 120) {
          return res.status(400).json({ success: false, error: "Age must be a whole number from 0 to 120." });
        }
        updates.age = age;
      }
    }

    const model = req.user.role === "trainer" ? Trainer : User;
    const user = await model.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true, runValidators: true }).select("-password");
    if (!user) return res.status(404).json({ success: false, error: "Account not found." });
    return res.json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || "Unable to save profile." });
  }
});
router.post("/me/photo", (req, res) => upload.single("photo")(req, res, async (err) => {
  if (err || !req.file) return res.status(400).json({ success: false, error: err?.message || "A JPG, PNG, or WEBP photo is required (max 5MB)." });
  try {
    const model = req.user.role === "trainer" ? Trainer : User;
    const photoUrl = `/uploads/profiles/${req.file.filename}`;
    const user = await model.findByIdAndUpdate(req.user.id, { $set: { photoUrl } }, { new: true }).select("-password");
    if (!user) return res.status(404).json({ success: false, error: "Account not found." });
    return res.json({ success: true, photoUrl, user });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || "Unable to save profile photo." });
  }
}));
router.get("/trainer/client-search", requireRole("trainer"), async (req, res) => { const query = String(req.query.q || "").trim().toLowerCase(); if (query.length < 2) return res.status(400).json({ success: false, error: "Enter at least two characters to search." }); const matcher = { $regex: query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" }; const clients = await User.find({ role: "client", accountStatus: "active", $or: [{ email: matcher }, { username: matcher }] }).select("name username email photoUrl").limit(10).lean(); const existing = await TrainerClientConnection.find({ trainerId: req.user.id, clientId: { $in: clients.map(c => String(c._id)) } }).select("clientId status").lean(); const statusByClient = new Map(existing.map(item => [String(item.clientId), item.status])); res.json({ success: true, clients: clients.map(client => ({ _id: client._id, name: client.name, username: client.username || null, email: client.email, photoUrl: client.photoUrl || "", requestStatus: statusByClient.get(String(client._id)) || null })) }); });
router.post("/trainer/client-requests", requireRole("trainer"), async (req, res) => { const clientId = String(req.body.clientId || ""); if (!valid(clientId)) return res.status(400).json({ success: false, error: "A valid client is required." }); const client = await User.findOne({ _id: clientId, role: "client", accountStatus: "active" }).select("name").lean(); if (!client) return res.status(404).json({ success: false, error: "Client not found." }); const existing = await TrainerClientConnection.findOne({ trainerId: req.user.id, clientId }); if (existing && ["pending", "accepted"].includes(existing.status)) return res.status(409).json({ success: false, error: `A ${existing.status} connection already exists.` }); const connection = existing ? await TrainerClientConnection.findByIdAndUpdate(existing._id, { status: "pending", respondedAt: null }, { new: true }) : await TrainerClientConnection.create({ trainerId: req.user.id, clientId }); const trainer = await Trainer.findById(req.user.id).select("name").lean(); await Notification.create({ userId: clientId, title: "Trainer connection request", body: `${trainer?.name || "A trainer"} wants to connect with you.`, type: "connection" }); res.status(201).json({ success: true, request: connection }); });
router.get("/trainer/client-requests", requireRole("trainer"), async (req, res) => { const requests = await TrainerClientConnection.find({ trainerId: req.user.id }).sort({ updatedAt: -1 }).lean(); res.json({ success: true, requests }); });
router.get("/client/trainer-requests", requireRole("client"), async (req, res) => { const requests = await TrainerClientConnection.find({ clientId: req.user.id }).sort({ updatedAt: -1 }).lean(); const trainers = await Trainer.find({ _id: { $in: requests.map(r => r.trainerId).filter(valid) } }).select("name photoUrl gym").lean(); const byId = new Map(trainers.map(t => [String(t._id), t])); res.json({ success: true, requests: requests.map(request => ({ ...request, trainer: byId.get(String(request.trainerId)) || null })) }); });
router.get("/client/trainer", requireRole("client"), async (req, res) => { const connection = await TrainerClientConnection.findOne({ clientId: req.user.id, status: "accepted" }).sort({ updatedAt: -1 }).lean(); if (!connection) return res.json({ success: true, trainer: null }); const trainer = await Trainer.findById(connection.trainerId).select("-password").lean(); res.json({ success: true, trainer: trainer || null }); });
router.get("/client/trainers", requireRole("client"), async (req, res) => { const q = String(req.query.q || "").trim(); const matcher = q ? { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } : null; const filter = { accountStatus: "active", ...(matcher ? { $or: [{ name: matcher }, { specialties: matcher }] } : {}) }; const trainers = await Trainer.find(filter).select("name email photoUrl specialties").sort({ createdAt: -1 }).lean(); res.json({ success: true, trainers: trainers.map(t => ({ ...t, specializations: t.specialties || [] })) }); });
router.get("/client/trainers/:trainerId", requireRole("client"), async (req, res) => { if (!valid(req.params.trainerId)) return res.status(404).json({ success: false, error: "Trainer not found." }); const trainer = await Trainer.findOne({ _id: req.params.trainerId, accountStatus: "active" }).select("-password").lean(); if (!trainer) return res.status(404).json({ success: false, error: "Trainer not found." }); res.json({ success: true, trainer: { ...trainer, location: trainer.locationName || "", specializations: trainer.specialties || [], reviewCount: trainer.reviewsCount || 0 } }); });
router.patch("/client/trainer-requests/:id", requireRole("client"), async (req, res) => { const status = req.body.status; if (!["accepted", "rejected"].includes(status)) return res.status(400).json({ success: false, error: "Status must be accepted or rejected." }); const request = await TrainerClientConnection.findOneAndUpdate({ _id: req.params.id, clientId: req.user.id, status: "pending" }, { status, respondedAt: new Date() }, { new: true }); if (!request) return res.status(404).json({ success: false, error: "Pending request not found." }); if (status === "accepted") await Notification.create({ userId: request.trainerId, title: "Connection accepted", body: "A client accepted your connection request.", type: "connection" }); res.json({ success: true, request }); });
router.get("/trainer/clients", requireRole("trainer"), async (req, res) => { const links = await TrainerClientConnection.find({ trainerId: req.user.id, status: "accepted" }).sort({ updatedAt: -1 }).lean(); const ids = links.map(link => String(link.clientId)).filter(valid); const clients = await User.find({ _id: { $in: ids }, role: "client" }).select("name username email photoUrl goal fitnessLevel age height weight").lean(); res.json({ success: true, clients }); });
router.get("/trainer/clients/:clientId", requireRole("trainer"), async (req, res) => { const { clientId } = req.params; if (!valid(clientId)) return res.status(404).json({ success: false, error: "Client not found." }); if (!await clientOfTrainer(req.user.id, clientId)) return res.status(403).json({ success: false, error: "This client is not assigned to you." }); const client = await User.findOne({ _id: clientId, role: "client" }).select("-password").lean(); if (!client) return res.status(404).json({ success: false, error: "Client not found." }); const [plans, bookings, assessments, sessions] = await Promise.all([WorkoutPlan.find({ trainerId: req.user.id, clientId }).lean(), Booking.find({ trainerId: req.user.id, clientId }).lean(), (await import("../models/PostureRecord.js")).default.find({ profileId: clientId }).sort({ createdAt: -1 }).limit(10).lean(), Session.find({ userId: clientId }).sort({ createdAt: -1 }).limit(100).lean()]); res.json({ success: true, client, plans, bookings, assessments, sessions }); });
router.get("/notifications", async (req, res) => { const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(100); res.json({ success: true, notifications, unreadCount: notifications.filter(n => !n.readAt).length }); });
router.patch("/notifications/:id/read", async (req, res) => { const notification = await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, { readAt: new Date() }, { new: true }); if (!notification) return res.status(404).json({ success: false, error: "Notification not found." }); res.json({ success: true, notification }); });
router.patch("/notifications/read-all", async (req, res) => { await Notification.updateMany({ userId: req.user.id, readAt: null }, { readAt: new Date() }); res.json({ success: true }); });
router.get("/workout-plans/me", requireRole("client"), async (req, res) => res.json({ success: true, plans: await WorkoutPlan.find({ clientId: req.user.id }).sort({ createdAt: -1 }) }));
router.get("/workout-plans", requireRole("trainer"), async (req, res) => { const plans = await WorkoutPlan.find({ trainerId: req.user.id }).sort({ createdAt: -1 }).lean(); const clients = await User.find({ _id: { $in: plans.map(plan => plan.clientId).filter(valid) }, role: "client" }).select("name photoUrl").lean(); const clientById = new Map(clients.map(client => [String(client._id), client])); res.json({ success: true, plans: plans.map(plan => ({ ...plan, client: clientById.get(String(plan.clientId)) || null })) }); });
router.post("/workout-plans", requireRole("trainer"), async (req, res) => { const { clientId, name } = req.body; if (!valid(clientId) || !name?.trim()) return res.status(400).json({ success: false, error: "Client and plan name are required." }); if (!await clientOfTrainer(req.user.id, clientId)) return res.status(403).json({ success: false, error: "Client is not assigned to you." }); const plan = await WorkoutPlan.create({ ...req.body, trainerId: req.user.id, clientId }); res.status(201).json({ success: true, plan }); });
router.get("/questions", async (req, res) => { const filter = req.user.role === "trainer" ? { trainerId: req.user.id } : { clientId: req.user.id }; res.json({ success: true, questions: await Question.find(filter).sort({ createdAt: -1 }) }); });
router.post("/questions", requireRole("client"), async (req, res) => { const { trainerId, question } = req.body; if (!valid(trainerId) || !question?.trim()) return res.status(400).json({ success: false, error: "Trainer and question are required." }); if (!await clientOfTrainer(trainerId, req.user.id)) return res.status(403).json({ success: false, error: "You can only ask your assigned trainer." }); const item = await Question.create({ trainerId, clientId: req.user.id, question }); res.status(201).json({ success: true, question: item }); });
router.patch("/questions/:id/answer", requireRole("trainer"), async (req, res) => { if (!req.body.answer?.trim()) return res.status(400).json({ success: false, error: "An answer is required." }); const question = await Question.findOneAndUpdate({ _id: req.params.id, trainerId: req.user.id }, { answer: req.body.answer.trim(), answeredAt: new Date() }, { new: true }); if (!question) return res.status(404).json({ success: false, error: "Question not found." }); res.json({ success: true, question }); });
router.get("/reviews", async (req, res) => { const trainerId = req.user.role === "trainer" ? req.user.id : req.query.trainerId; if (!trainerId || (req.user.role === "client" && !valid(trainerId))) return res.status(400).json({ success: false, error: "Trainer is required." }); const reviews = await Review.find({ trainerId }).sort({ createdAt: -1 }).lean(); const clients = await User.find({ _id: { $in: reviews.map(r => r.clientId).filter(valid) } }).select("name photoUrl").lean(); const names = new Map(clients.map(c => [String(c._id), c])); const averageRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0; res.json({ success: true, reviews: reviews.map(r => ({ ...r, client: names.get(String(r.clientId)) || null })), averageRating, totalReviews: reviews.length }); });
router.post("/reviews", requireRole("client"), async (req, res) => { const { bookingId, rating, comment } = req.body; if (!valid(bookingId) || !Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ success: false, error: "A completed session and 1–5 rating are required." }); const booking = await Booking.findOne({ _id: bookingId, clientId: req.user.id, status: "completed" }); if (!booking) return res.status(403).json({ success: false, error: "Only your completed sessions can be reviewed." }); try { const review = await Review.create({ trainerId: booking.trainerId, clientId: req.user.id, bookingId, rating, comment }); res.status(201).json({ success: true, review }); } catch (error) { if (error.code === 11000) return res.status(409).json({ success: false, error: "This session has already been reviewed." }); throw error; } });
const money = (value) => Math.round(Number(value || 0) * 100) / 100;
const eventQuote = (event, ticketTypeId, quantity) => {
  const ticket = event.ticketTypes.id(ticketTypeId);
  const qty = Number(quantity);
  if (!ticket || !Number.isInteger(qty) || qty < 1 || qty > 10) throw new Error("Choose a valid ticket quantity.");
  if (ticket.quantity && ticket.sold + qty > ticket.quantity) throw new Error("That ticket type is sold out.");
  if (event.capacity && event.registeredCount + qty > event.capacity) throw new Error("This event is sold out.");
  const subtotal = money(ticket.price * qty), platformFee = money(subtotal * 0.02), tax = money((subtotal + platformFee) * 0.18);
  return { ticket, quantity: qty, subtotal, platformFee, tax, total: money(subtotal + platformFee + tax) };
};
const gymQuote = (gym, planId) => {
  const plan = gym.memberships.id(planId);
  if (!plan || !plan.active) throw new Error("That membership plan is unavailable.");
  const subtotal = money(plan.price), tax = money(subtotal * 0.18);
  return { plan, subtotal, tax, total: money(subtotal + tax) };
};
const razorpayClient = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) throw new Error("Payments are not configured.");
  return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
};
const verifySignature = (orderId, paymentId, signature) => crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "").update(`${orderId}|${paymentId}`).digest("hex") === signature;

router.get("/gyms", async (req, res) => { try { const { city, openNow, twentyFourSeven, q } = req.query; const filter = { active: true }; if (city) filter.city = new RegExp(String(city), "i"); if (twentyFourSeven === "true") filter.openingHours = /24/i; if (q) filter.$or = [{ name: new RegExp(String(q), "i") }, { tags: new RegExp(String(q), "i") }, { facilities: new RegExp(String(q), "i") }]; const gyms = await Gym.find(filter).sort({ rating: -1, createdAt: -1 }).lean(); res.json({ success: true, gyms }); } catch (error) { res.status(500).json({ success: false, error: error.message }); } });
router.get("/gyms/my/memberships", requireRole("client"), async (req, res) => { const memberships = await GymMembership.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean(); res.json({ success: true, memberships }); });
router.get("/gyms/memberships/:membershipId", requireRole("client"), async (req, res) => { const membership = await GymMembership.findOne({ _id: req.params.membershipId, userId: req.user.id }).lean(); if (!membership) return res.status(404).json({ success: false, error: "Membership not found." }); res.json({ success: true, membership }); });
router.get("/gyms/:gymId", async (req, res) => { const gym = await Gym.findOne({ _id: req.params.gymId, active: true }).lean(); if (!gym) return res.status(404).json({ success: false, error: "Gym not found." }); res.json({ success: true, gym }); });
router.get("/gyms/:gymId/plans", async (req, res) => { const gym = await Gym.findOne({ _id: req.params.gymId, active: true }).select("name memberships").lean(); if (!gym) return res.status(404).json({ success: false, error: "Gym not found." }); res.json({ success: true, plans: (gym.memberships || []).filter(plan => plan.active) }); });
router.post("/gyms/:gymId/save", requireRole("client"), async (req, res) => { if (!await Gym.exists({ _id: req.params.gymId, active: true })) return res.status(404).json({ success: false, error: "Gym not found." }); await SavedGym.updateOne({ gymId: req.params.gymId, userId: req.user.id }, { $setOnInsert: { gymId: req.params.gymId, userId: req.user.id } }, { upsert: true }); res.json({ success: true, saved: true }); });
router.delete("/gyms/:gymId/save", requireRole("client"), async (req, res) => { await SavedGym.deleteOne({ gymId: req.params.gymId, userId: req.user.id }); res.json({ success: true, saved: false }); });
router.post("/gyms/:gymId/membership/quote", requireRole("client"), async (req, res) => { try { const gym = await Gym.findOne({ _id: req.params.gymId, active: true }); if (!gym) return res.status(404).json({ success: false, error: "Gym not found." }); const quote = gymQuote(gym, req.body.planId); res.json({ success: true, quote: { ...quote, plan: quote.plan.toObject() } }); } catch (error) { res.status(400).json({ success: false, error: error.message }); } });
router.post("/gyms/:gymId/payment/order", requireRole("client"), async (req, res) => { try { const gym = await Gym.findOne({ _id: req.params.gymId, active: true }); if (!gym) return res.status(404).json({ success: false, error: "Gym not found." }); const quote = gymQuote(gym, req.body.planId); const membership = await GymMembership.create({ gymId: gym._id, userId: req.user.id, planId: quote.plan._id, planName: quote.plan.name, type: quote.plan.type, amount: quote.total, subtotal: quote.subtotal, tax: quote.tax }); const order = await razorpayClient().orders.create({ amount: Math.round(quote.total * 100), currency: "INR", receipt: `gym_${membership._id}` }); membership.razorpayOrderId = order.id; await membership.save(); res.status(201).json({ success: true, keyId: process.env.RAZORPAY_KEY_ID, order, membershipId: membership._id, quote: { subtotal: quote.subtotal, tax: quote.tax, total: quote.total } }); } catch (error) { res.status(400).json({ success: false, error: error.message }); } });
router.post("/gyms/:gymId/payment/verify", requireRole("client"), async (req, res) => { try { const { membershipId, razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body; const membership = await GymMembership.findOne({ _id: membershipId, gymId: req.params.gymId, userId: req.user.id }); if (!membership) return res.status(404).json({ success: false, error: "Membership payment not found." }); if (membership.paymentStatus === "paid" || membership.status === "active") return res.status(409).json({ success: false, error: "Payment was already verified." }); if (membership.razorpayOrderId !== orderId || !verifySignature(orderId, paymentId, signature)) return res.status(400).json({ success: false, error: "Payment verification failed." }); membership.razorpayPaymentId = paymentId; membership.paymentSignature = signature; membership.paymentStatus = "paid"; membership.status = "active"; membership.startAt = new Date(); const gym = await Gym.findById(req.params.gymId); const plan = gym.memberships.id(membership.planId); membership.endAt = new Date(Date.now() + Number(plan.durationDays) * 86400000); await membership.save(); await Notification.create({ userId: req.user.id, title: "Gym membership activated", body: `${membership.planName} at ${gym.name} is active.`, type: "payment" }); res.json({ success: true, membership }); } catch (error) { res.status(400).json({ success: false, error: error.message }); } });

router.get("/events", async (req, res) => { try { const filter = { status: "active", startsAt: { $gte: new Date() } }; if (req.query.city) filter.city = new RegExp(String(req.query.city), "i"); if (req.query.category) filter.category = String(req.query.category); const events = await Event.find(filter).sort({ startsAt: 1 }).lean(); res.json({ success: true, events }); } catch (error) { res.status(500).json({ success: false, error: error.message }); } });
router.get("/events/my/registrations", requireRole("client"), async (req, res) => { const registrations = await EventRegistration.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean(); res.json({ success: true, registrations }); });
router.get("/events/registrations/:registrationId", requireRole("client"), async (req, res) => { const registration = await EventRegistration.findOne({ _id: req.params.registrationId, userId: req.user.id }).lean(); if (!registration) return res.status(404).json({ success: false, error: "Registration not found." }); const event = await Event.findById(registration.eventId).lean(); res.json({ success: true, registration, event }); });
router.get("/events/:eventId", async (req, res) => { const event = await Event.findOne({ _id: req.params.eventId, status: "active" }).lean(); if (!event) return res.status(404).json({ success: false, error: "Event not found." }); res.json({ success: true, event }); });
router.post("/events/:eventId/registration/quote", requireRole("client"), async (req, res) => { try { const event = await Event.findOne({ _id: req.params.eventId, status: "active" }); if (!event) return res.status(404).json({ success: false, error: "Event not found." }); const quote = eventQuote(event, req.body.ticketTypeId, req.body.quantity); res.json({ success: true, quote: { ...quote, ticket: quote.ticket.toObject() } }); } catch (error) { res.status(400).json({ success: false, error: error.message }); } });
router.post("/events/:eventId/payment/order", requireRole("client"), async (req, res) => { try { const event = await Event.findOne({ _id: req.params.eventId, status: "active" }); if (!event) return res.status(404).json({ success: false, error: "Event not found." }); const quote = eventQuote(event, req.body.ticketTypeId, req.body.quantity); const attendee = req.body.attendee || {}; if (![attendee.fullName, attendee.email, attendee.phone].every(value => String(value || "").trim())) return res.status(400).json({ success: false, error: "Name, email, and phone are required." }); const registration = await EventRegistration.create({ eventId: event._id, userId: req.user.id, ticketTypeId: quote.ticket._id, ticketType: quote.ticket.name, quantity: quote.quantity, attendee, subtotal: quote.subtotal, platformFee: quote.platformFee, tax: quote.tax, total: quote.total }); const order = await razorpayClient().orders.create({ amount: Math.round(quote.total * 100), currency: "INR", receipt: `event_${registration._id}` }); registration.razorpayOrderId = order.id; await registration.save(); res.status(201).json({ success: true, keyId: process.env.RAZORPAY_KEY_ID, order, registrationId: registration._id, quote: { subtotal: quote.subtotal, platformFee: quote.platformFee, tax: quote.tax, total: quote.total } }); } catch (error) { res.status(400).json({ success: false, error: error.message }); } });
router.post("/events/:eventId/payment/verify", requireRole("client"), async (req, res) => { try { const { registrationId, razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body; const registration = await EventRegistration.findOne({ _id: registrationId, eventId: req.params.eventId, userId: req.user.id }); if (!registration) return res.status(404).json({ success: false, error: "Registration payment not found." }); if (registration.paymentStatus === "paid") return res.status(409).json({ success: false, error: "Payment was already verified." }); if (registration.razorpayOrderId !== orderId || !verifySignature(orderId, paymentId, signature)) return res.status(400).json({ success: false, error: "Payment verification failed." }); const event = await Event.findOne({ _id: req.params.eventId, status: "active" }); if (!event) return res.status(404).json({ success: false, error: "Event not found." }); const ticket = event.ticketTypes.id(registration.ticketTypeId); if (!ticket || (ticket.quantity && ticket.sold + registration.quantity > ticket.quantity) || (event.capacity && event.registeredCount + registration.quantity > event.capacity)) return res.status(409).json({ success: false, error: "The selected ticket is now sold out." }); ticket.sold += registration.quantity; event.registeredCount += registration.quantity; event.registrations.push(String(req.user.id)); await event.save(); registration.razorpayPaymentId = paymentId; registration.paymentSignature = signature; registration.paymentStatus = "paid"; registration.registrationStatus = "confirmed"; await registration.save(); await Notification.create({ userId: req.user.id, title: "Event registration confirmed", body: `Your registration for ${event.name} is confirmed.`, type: "payment" }); res.json({ success: true, registration, event }); } catch (error) { res.status(400).json({ success: false, error: error.message }); } });
router.get("/trainer/assessments/:assessmentId", requireRole("trainer"), async (req, res) => { if (!valid(req.params.assessmentId)) return res.status(404).json({ success: false, error: "Assessment not found." }); const assessment = await PostureRecord.findById(req.params.assessmentId).lean(); if (!assessment || !await clientOfTrainer(req.user.id, assessment.profileId)) return res.status(404).json({ success: false, error: "Assessment not found." }); const client = await User.findById(assessment.profileId).select("name email").lean(); res.json({ success: true, assessment, client }); });
router.get("/trainer/dashboard", requireRole("trainer"), async (req, res) => { const links = await TrainerClientConnection.find({ trainerId: req.user.id, status: "accepted" }).lean(); const clientIds = links.map(link => String(link.clientId)).filter(valid); const [clients, upcomingSessions, recentMessages, recentAssessments, reviews, clientSessions] = await Promise.all([User.find({ _id: { $in: clientIds }, role: "client" }).select("name photoUrl").lean(), Booking.find({ trainerId: req.user.id, slotTime: { $gte: new Date() }, status: { $nin: ["cancelled", "completed"] } }).sort({ slotTime: 1 }).limit(5).lean(), Message.find({ trainerId: req.user.id }).sort({ createdAt: -1 }).limit(5).lean(), PostureRecord.find({ profileId: { $in: clientIds } }).sort({ createdAt: -1 }).limit(5).lean(), Review.find({ trainerId: req.user.id }).lean(), Session.find({ userId: { $in: clientIds } }).sort({ createdAt: -1 }).lean()]); const clientById = new Map(clients.map(client => [String(client._id), client])); const today = new Date(); const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()); const end = new Date(start); end.setDate(end.getDate() + 1); const todaySessions = upcomingSessions.filter(booking => new Date(booking.slotTime) >= start && new Date(booking.slotTime) < end).length; const sessionCountByClient = new Map(clientIds.map(id => [id, 0])); clientSessions.forEach(session => sessionCountByClient.set(String(session.userId), (sessionCountByClient.get(String(session.userId)) || 0) + 1)); const avgRating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0; res.json({ success: true, stats: { clientCount: clients.length, todaySessions, averageRating: avgRating, reviewCount: reviews.length, revenue: 0 }, upcomingSessions: upcomingSessions.map(booking => ({ ...booking, client: clientById.get(String(booking.clientId)) || null })), recentMessages: recentMessages.map(message => ({ ...message, client: clientById.get(String(message.clientId)) || null })), clientProgress: clients.map(client => ({ client, workoutSetCount: sessionCountByClient.get(String(client._id)) || 0 })), assessments: recentAssessments.map(assessment => ({ ...assessment, client: clientById.get(String(assessment.profileId)) || null })) }); });
router.get("/billing", requireRole("trainer"), async (_req, res) => res.json({ success: true, totalPaid: 0, outstanding: 0, nextPayout: 0, transactions: [] }));
export default router;
