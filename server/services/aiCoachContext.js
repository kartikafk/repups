import PostureRecord from "../models/PostureRecord.js";
import Session from "../models/Session.js";

export async function buildCoachContext(userId) {
  const [posture, sessions] = await Promise.all([PostureRecord.find({ profileId: userId }).sort({ createdAt: -1 }).limit(5).lean(), Session.find({ userId }).sort({ createdAt: -1 }).limit(5).lean()]);
  const records = [...posture.map((record) => ({ date: record.createdAt, type: "posture", score: record.overallScore, findings: record.findings || [], baseline: record.baseline || null, ml: record.ml || null })), ...sessions.map((session) => ({ date: session.createdAt, type: "workout", exercise: session.exercise, score: session.avgScore, findings: (session.topIssues || []).map((issue) => issue.label || issue.key), baseline: session.baseline || null, ml: session.ml || null }))];
  const recurring = records.flatMap((record) => record.findings).filter(Boolean).slice(0, 3);
  return { records, trend: recurring.length ? `Recent focus areas: ${recurring.join(", ")}.` : "Complete a posture scan or workout set to unlock personalised guidance." };
}
