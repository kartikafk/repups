import express from 'express';
import Session from '../models/Session.js';

const router = express.Router();

const inferMuscleGroup = (exerciseName = "") => {
  const name = exerciseName.toLowerCase();
  if (name.includes("squat") || name.includes("leg") || name.includes("calf") || name.includes("deadlift")) return "Legs";
  if (name.includes("bench") || name.includes("push") || name.includes("chest") || name.includes("fly")) return "Chest";
  if (name.includes("row") || name.includes("pull") || name.includes("lat") || name.includes("chin")) return "Back";
  if (name.includes("press") || name.includes("shoulder") || name.includes("raise")) return "Shoulders";
  if (name.includes("curl") || name.includes("tricep") || name.includes("extension")) return "Arms";
  return "Core";
};

const isInvalidUserId = (userId) =>
  !userId || userId === 'undefined' || userId === 'null' || userId === 'guest' || userId === 'guest_user';

// POST /api/sessions - Save a completed set report
router.post('/', async (req, res) => {
  try {
    const { 
      exercise, 
      muscleGroup,
      userId, 
      setIndex, 
      date, 
      weight, 
      youtubeId, 
      videoUrl, 
      avgScore, 
      repCount, 
      avgRom, 
      consistency, 
      reps, 
      avgTempo, 
      topIssues 
    } = req.body;

    // 🔑 Graceful fallback for development/mobile testing if a strict mock or temporary id is passed
    const resolvedUserId = isInvalidUserId(userId) ? '640000000000000000000000' : userId;

    const workoutDate = date || new Date().toISOString().split('T')[0];
    const targetSetIndex = setIndex !== undefined ? setIndex : 0;
    const resolvedMuscleGroup = muscleGroup || inferMuscleGroup(exercise);

    const session = await Session.findOneAndUpdate(
      { 
        userId: resolvedUserId, 
        exercise, 
        setIndex: targetSetIndex, 
        date: workoutDate 
      },
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
        topIssues
      },
      { new: true, upsert: true }
    );

    res.status(201).json(session);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/sessions - Return records belonging to the requested userId
router.get('/', async (req, res) => {
  try {
    const { userId, exercise, muscleGroup, date, limit } = req.query;

    const resolvedUserId = isInvalidUserId(userId) ? '640000000000000000000000' : userId;

    let query = { userId: resolvedUserId };
    if (exercise) query.exercise = exercise;
    if (muscleGroup) query.muscleGroup = muscleGroup;
    if (date) query.date = date;

    const maxLimit = Math.min(parseInt(limit) || 200, 500);
    const sessions = await Session.find(query).sort({ date: 1, createdAt: 1 }).limit(maxLimit);
    
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;