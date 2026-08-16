import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { buildCoachContext } from "../services/aiCoachContext.js";
import { getCoachResponse } from "../services/aiCoachClient.js";
import CoachMessage from "../models/CoachMessage.js";

const router = express.Router();
router.use(requireAuth, requireRole("client"));
async function respond(req, res) { const context = await buildCoachContext(req.user.id); const reply = await getCoachResponse(context, String(req.body?.query || "")); await CoachMessage.create({ userId: req.user.id, message: reply.message, mode: reply.mode }); res.json({ success: true, message: reply.message, reply: reply.message, response: reply.message, generatedAt: new Date(), mode: reply.mode, context }); }
router.get("/insights", (req, res, next) => respond(req, res).catch(next));
router.post("/chat", (req, res, next) => respond(req, res).catch(next));
router.post("/generate-prescription", async (req, res, next) => { try { const context = await buildCoachContext(req.user.id); res.json({ success: true, summary: context.trend, days: [], mode: "mock" }); } catch (error) { next(error); } });
export default router;
