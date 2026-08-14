import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import Trainer from "../models/Trainer.js";
import Session from "../models/Session.js";
import Booking from "../models/Booking.js";
import AuditLog from "../models/AuditLog.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { audit } from "../utils/audit.js";

const router = express.Router();
router.use(requireAuth, requireRole("admin"));
const paging = (query) => ({ page: Math.max(1, Number(query.page) || 1), limit: Math.min(100, Math.max(1, Number(query.limit) || 25)) });
const shape = (user, role = user.role) => ({ _id: user._id, name: user.name, email: user.email, role, accountStatus: user.accountStatus || "active", createdAt: user.createdAt, gym: user.gym, goal: user.goal });

router.get("/health", (_req, res) => res.json({ success: true, database: mongoose.connection.readyState === 1 }));
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
