import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import Trainer from "../models/Trainer.js";
import Session from "../models/Session.js";
import Booking from "../models/Booking.js";
import AuditLog from "../models/AuditLog.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { audit } from "../utils/audit.js";
import { Gym } from "../models/Feature.js";

const router = express.Router();
router.use(requireAuth, requireRole("admin"));
const paging = (query) => ({ page: Math.max(1, Number(query.page) || 1), limit: Math.min(100, Math.max(1, Number(query.limit) || 25)) });
const shape = (user, role = user.role) => ({ _id: user._id, name: user.name, email: user.email, role, accountStatus: user.accountStatus || "active", createdAt: user.createdAt, gym: user.gym, goal: user.goal });

router.get("/health", (_req, res) => res.json({ success: true, database: mongoose.connection.readyState === 1 }));
const cleanList = (value) => Array.isArray(value) ? value.map(String).map((item) => item.trim()).filter(Boolean) : String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
const gymPayload = (body) => {
  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);
  const payload = {
    name: String(body.name || "").trim(), city: String(body.city || "").trim(), location: String(body.location || "").trim(),
    address: String(body.address || "").trim(), mapsUrl: String(body.mapsUrl || "").trim(), description: String(body.description || "").trim(),
    contact: String(body.contact || "").trim(), openingHours: String(body.openingHours || "").trim(), facilities: cleanList(body.facilities), active: body.active !== false,
  };
  if (!payload.name) throw new Error("Gym name is required.");
  if (payload.mapsUrl) { try { const url = new URL(payload.mapsUrl); if (!/^https?:$/.test(url.protocol)) throw new Error(); } catch { throw new Error("Directions link must be a valid http(s) URL."); } }
  if (body.latitude !== "" || body.longitude !== "") { if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) throw new Error("Enter a valid latitude and longitude."); payload.coordinates = { type: "Point", coordinates: [longitude, latitude] }; }
  return payload;
};
router.get("/gyms", async (_req, res, next) => { try { res.json({ success: true, gyms: await Gym.find().sort({ createdAt: -1 }).lean() }); } catch (error) { next(error); } });
router.post("/gyms", async (req, res, next) => { try { const gym = await Gym.create(gymPayload(req.body)); await audit(req, "gym.created", "gym", gym._id, { name: gym.name }); res.status(201).json({ success: true, gym }); } catch (error) { if (error.message) return res.status(400).json({ success: false, error: error.message }); next(error); } });
router.patch("/gyms/:gymId", async (req, res, next) => { try { const gym = await Gym.findByIdAndUpdate(req.params.gymId, gymPayload(req.body), { new: true, runValidators: true }); if (!gym) return res.status(404).json({ success: false, error: "Gym not found." }); await audit(req, "gym.updated", "gym", gym._id, { name: gym.name }); res.json({ success: true, gym }); } catch (error) { if (error.message) return res.status(400).json({ success: false, error: error.message }); next(error); } });
router.get("/dashboard", async (_req, res, next) => { try {
  const [clients, admins, trainers, sessions, bookings, recentUsers] = await Promise.all([User.countDocuments({ role: "client", deletedAt: null }), User.countDocuments({ role: "admin", deletedAt: null }), Trainer.countDocuments(), Session.countDocuments(), Booking.countDocuments(), User.find({ deletedAt: null }).select("name email role accountStatus createdAt").sort({ createdAt: -1 }).limit(8).lean()]);
  res.json({ success: true, stats: { clients, admins, trainers, sessions, bookings, totalUsers: clients + admins + trainers }, recentUsers: recentUsers.map(shape) });
} catch (error) { next(error); } });
router.get("/users", async (req, res, next) => { try {
  const { page, limit } = paging(req.query); const role = req.query.role || "all"; const q = String(req.query.q || "").trim(); const match = q ? { $or: [{ name: { $regex: q, $options: "i" } }, { email: { $regex: q, $options: "i" } }] } : {};
  const Model = role === "trainer" ? Trainer : User; const filter = role === "trainer" ? match : { ...match, deletedAt: null, ...(role === "all" ? {} : { role }) };
  const [users, total] = await Promise.all([Model.find(filter).select("name email role accountStatus gym goal createdAt").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), Model.countDocuments(filter)]);
  res.json({ success: true, page, limit, total, users: users.map((user) => shape(user, role === "trainer" ? "trainer" : user.role)) });
} catch (error) { next(error); } });
router.patch("/users/:role/:id", async (req, res, next) => { try {
  const { role, id } = req.params; const { accountStatus } = req.body; if (!['active', 'suspended'].includes(accountStatus)) return res.status(400).json({ success: false, error: "Invalid account status." }); if (role === 'admin' && String(req.user.id) === id && accountStatus === 'suspended') return res.status(400).json({ success: false, error: "You cannot suspend yourself." });
  const Model = role === 'trainer' ? Trainer : User; const user = await Model.findByIdAndUpdate(id, { accountStatus }, { new: true }).lean(); if (!user) return res.status(404).json({ success: false, error: "User not found." }); await audit(req, "user.status_changed", role, id, { accountStatus }); res.json({ success: true, user: shape(user, role) });
} catch (error) { next(error); } });
router.post("/users/:id/anonymize", async (req, res, next) => { try { const user = await User.findOne({ _id: req.params.id, role: { $ne: "admin" } }); if (!user) return res.status(404).json({ success: false, error: "User not found." }); user.name = "Deleted User"; user.email = `deleted-${user._id}@deleted.local`; user.accountStatus = "suspended"; user.deletedAt = new Date(); await user.save(); await audit(req, "user.anonymized", "user", user._id); res.json({ success: true }); } catch (error) { next(error); } });
router.get("/users/:id/export", async (req, res, next) => { try { const user = await User.findById(req.params.id).select("-password").lean(); if (!user) return res.status(404).json({ success: false, error: "User not found." }); const sessions = await Session.find({ userId: String(user._id) }).lean(); await audit(req, "user.exported", "user", user._id); res.json({ success: true, data: { user, sessions } }); } catch (error) { next(error); } });
router.get("/sessions", async (req, res, next) => { try { const { page, limit } = paging(req.query); const filter = req.query.userId ? { userId: req.query.userId } : {}; const [sessions, total] = await Promise.all([Session.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), Session.countDocuments(filter)]); res.json({ success: true, sessions, total, page, limit }); } catch (error) { next(error); } });
router.get("/bookings", async (_req, res, next) => { try { res.json({ success: true, bookings: await Booking.find().sort({ slotTime: -1 }).limit(100).lean() }); } catch (error) { next(error); } });
router.get("/audit-logs", async (req, res, next) => { try { const { page, limit } = paging(req.query); const [logs, total] = await Promise.all([AuditLog.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), AuditLog.countDocuments()]); res.json({ success: true, logs, total, page, limit }); } catch (error) { next(error); } });
export default router;
