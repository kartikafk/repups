import express from "express";
import PostureRecord from "../models/PostureRecord.js";
import { requireAuth } from "../middleware/auth.js";
import { postureFeatures } from "../services/assessmentFeatures.js";
import { baselineFor } from "../services/cohortBaseline.js";
import { predictAnomaly } from "../services/mlClient.js";
import BodyProportions from "../models/BodyProportions.js";

const router = express.Router();

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

export default router;

