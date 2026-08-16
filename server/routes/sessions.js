import express from 'express';
import Session from '../models/Session.js';
import { requireAuth } from '../middleware/auth.js';
import { sessionFeatures } from '../services/assessmentFeatures.js';
import { baselineFor } from '../services/cohortBaseline.js';
import { predictAnomaly } from '../services/mlClient.js';

const router = express.Router();
// Require auth for all session routes
router.use(requireAuth);

const inferMuscleGroup = (exerciseName = "") => {
  const name = exerciseName.toLowerCase();
  if (name.includes("squat") || name.includes("leg") || name.includes("calf") || name.includes("deadlift")) return "Legs";
  if (name.includes("bench") || name.includes("push") || name.includes("chest") || name.includes("fly")) return "Chest";
  if (name.includes("row") || name.includes("pull") || name.includes("lat") || name.includes("chin")) return "Back";
  if (name.includes("press") || name.includes("shoulder") || name.includes("raise")) return "Shoulders";
  if (name.includes("curl") || name.includes("tricep") || name.includes("extension")) return "Arms";
  return "Core";
};

// POST /api/sessions - Save a completed set report
router.post('/', async (req, res) => {
  try {
    const { 
      exercise, muscleGroup, setIndex, date, weight, youtubeId, videoUrl,
      avgScore, repCount, avgRom, consistency, reps, avgTempo, topIssues
    } = req.body;
    // Never trust client-provided userId. Use authenticated user.
    const resolvedUserId = req.user && req.user.id;
    if (!resolvedUserId) return res.status(401).json({ error: 'Unauthorized' });

    const workoutDate = date || new Date().toISOString().split('T')[0];
    const targetSetIndex = setIndex !== undefined ? setIndex : 0;
    const resolvedMuscleGroup = muscleGroup || inferMuscleGroup(exercise);

    const featureVector = sessionFeatures({ avgScore, avgRom, consistency, repCount, avgTempo });
    const [baseline, ml] = await Promise.all([baselineFor(resolvedUserId, featureVector).catch(() => null), predictAnomaly({ exerciseId: exercise, features: featureVector })]);
    const session = await Session.findOneAndUpdate(
      { userId: resolvedUserId, exercise, setIndex: targetSetIndex, date: workoutDate },
      {
        exercise,
        muscleGroup: resolvedMuscleGroup,
        userId: resolvedUserId,
        setIndex: targetSetIndex,
        date: workoutDate,
        weight: weight !== undefined ? Number(weight) : 0,
        youtubeId: youtubeId || null,
        videoUrl: videoUrl || null,
        reps,
        repCount,
        avgScore,
        avgTempo,
        avgRom,
        consistency,
        topIssues,
        featureVector,
        baseline,
        ml
      },
      { new: true, upsert: true }
    );
    // Return only fields the client needs
    res.status(201).json({
      id: session._id,
      exercise: session.exercise,
      date: session.date,
      setIndex: session.setIndex,
      repCount: session.repCount,
      avgScore: session.avgScore,
      baseline: session.baseline,
      ml: session.ml
    });
  } catch (err) {
    res.status(400).json({ error: 'Invalid session data' });
  }
});

// GET /api/sessions - Return records belonging to the requested userId
router.get('/', async (req, res) => {
  try {
    const { exercise, muscleGroup, date, limit } = req.query;
    // Only return sessions for the authenticated user (or admin)
    const resolvedUserId = req.user && req.user.id;
    if (!resolvedUserId) return res.status(401).json({ error: 'Unauthorized' });
    let query = { userId: resolvedUserId };
    if (exercise) query.exercise = exercise;
    if (muscleGroup) query.muscleGroup = muscleGroup;
    if (date) query.date = date;

    const maxLimit = Math.min(parseInt(limit) || 200, 500);
    const sessions = await Session.find(query).sort({ date: 1, createdAt: 1 }).limit(maxLimit).select('exercise date setIndex repCount avgScore');
    
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
