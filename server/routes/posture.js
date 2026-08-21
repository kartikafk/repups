import express from "express";
import PostureRecord from "../models/PostureRecord.js";
import { requireAuth } from "../middleware/auth.js";
import { postureFeatures } from "../services/assessmentFeatures.js";
import { baselineFor } from "../services/cohortBaseline.js";
import { predictAnomaly } from "../services/mlClient.js";
import BodyProportions from "../models/BodyProportions.js";

const router = express.Router();

const postureSummary = (record) => ({
  _id: record._id,
  overallScore: record.overallScore,
  generatedAt: record.generatedAt,
  createdAt: record.createdAt,
  planes: record.planes,
  findings: record.findings,
});

// The signed-in user's token owns every posture record. Client-supplied IDs
// are deliberately ignored so one account cannot read or write another's data.
router.post("/save", requireAuth, async (req, res) => {
  try {
    const { overallScore, generatedAt, planes, findings, recommendations, heightInches, images, bodyProportions } = req.body;
    if (bodyProportions && Object.values(bodyProportions).every((value) => Number.isFinite(Number(value)))) await BodyProportions.findOneAndUpdate({ userId: req.user.id }, { ...bodyProportions, computedAt: new Date() }, { upsert: true });

    const featureVector = postureFeatures({ overallScore, planes });
    const [baseline, ml] = await Promise.all([baselineFor(req.user.id, featureVector).catch(() => null), predictAnomaly({ plane: "posture", features: featureVector })]);
    const newRecord = await PostureRecord.create({
      profileId: req.user.id,
      overallScore,
      generatedAt: generatedAt || new Date(),
      planes,
      findings,
      recommendations,
      heightInches,
      images,
      featureVector,
      baseline,
      ml,
    });

    return res.status(201).json({ success: true, recordId: newRecord.id, baseline, ml });
  } catch (error) {
    req.log?.error(error, "Posture save failed");
    return res.status(400).json({ success: false, error: "Invalid posture assessment data." });
  }
});

router.get("/:profileId/latest", requireAuth, async (req, res) => {
  try {
    if (req.params.profileId !== req.user.id) {
      return res.status(403).json({ success: false, error: "You can only access your own posture records." });
    }

    const record = await PostureRecord.findOne({ profileId: req.user.id })
      .sort({ createdAt: -1 });

    if (!record) {
      return res.json({ success: true, record: null });
    }

    return res.json({ success: true, record });
  } catch (error) {
    req.log?.error(error, "Posture fetch failed");
    return res.status(500).json({ success: false, error: "Unable to load posture assessment." });
  }
});

// Complete assessment history for the signed-in client. The account identity
// always comes from the JWT, not from a client-supplied profile ID.
router.get("/history", requireAuth, async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 100);
    const records = await PostureRecord.find({ profileId: req.user.id })
      .sort({ generatedAt: -1, createdAt: -1 })
      .limit(limit)
      .select("overallScore generatedAt createdAt planes findings")
      .lean();
    return res.json({ success: true, assessments: records.map(postureSummary) });
  } catch (error) {
    req.log?.error(error, "Posture history fetch failed");
    return res.status(500).json({ success: false, error: "Unable to load posture assessment history." });
  }
});

// Full report for one assessment that belongs to the signed-in client.
router.get("/report/:recordId", requireAuth, async (req, res) => {
  try {
    const record = await PostureRecord.findOne({ _id: req.params.recordId, profileId: req.user.id }).lean();
    if (!record) return res.status(404).json({ success: false, error: "Assessment report not found." });
    return res.json({ success: true, assessment: record });
  } catch (error) {
    return res.status(400).json({ success: false, error: "Invalid assessment report ID." });
  }
});

export default router;

