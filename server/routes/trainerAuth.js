import express from 'express';
import bcrypt from 'bcryptjs';
import Trainer from '../models/Trainer.js';
import { signToken, requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// 📍 GET: Find nearby trainers using MongoDB geospatial $near query
router.get('/nearby', async (req, res) => {
  try {
    const { lng, lat, maxDistanceKm } = req.query;

    if (!lng || !lat) {
      return res.status(400).json({ success: false, error: 'Longitude and latitude are required.' });
    }

    const maxDistanceMeters = (Number(maxDistanceKm) || 20) * 1000;

    const trainers = await Trainer.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: maxDistanceMeters
        }
      }
    }).select('-password');

    const trainersWithDistance = trainers.map(t => {
      const [tLng, tLat] = t.location.coordinates;
      const distanceKm = calculateDistanceKm(parseFloat(lat), parseFloat(lng), tLat, tLng);
      return {
        ...t.toObject(),
        distanceKm
      };
    });

    return res.status(200).json({ success: true, trainers: trainersWithDistance });
  } catch (err) {
    console.error('❌ Nearby Trainers Error:', err);
    return res.status(500).json({ success: false, error: 'Server error while fetching nearby trainers.' });
  }
});

// Helper distance formula
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

// 📍 GET: Fetch single trainer profile by ID (Strict check, no silent fallback)
// GET /api/trainers?exclude=<trainerId>&limit=4
// Used by the public profile page to suggest other available trainers.
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 4, 1), 20);
    const filter = {};

    if (req.query.exclude && /^[a-f\d]{24}$/i.test(req.query.exclude)) {
      filter._id = { $ne: req.query.exclude };
    }

    const trainers = await Trainer.find(filter)
      .select('-password')
      .sort({ rating: -1, createdAt: -1 })
      .limit(limit);

    return res.json({ success: true, trainers });
  } catch (err) {
    console.error('Trainer list error:', err);
    return res.status(500).json({ success: false, error: 'Unable to load trainers.' });
  }
});

// A review collection is intentionally not created until a completed booking
// can produce a verified review. This keeps the API contract stable without
// manufacturing ratings or comments.
router.get('/:id/reviews', async (req, res) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid trainer ID format.' });
    }

    const trainerExists = await Trainer.exists({ _id: req.params.id });
    if (!trainerExists) {
      return res.status(404).json({ success: false, error: 'Trainer not found.' });
    }

    return res.json({ success: true, reviews: [] });
  } catch (err) {
    console.error('Trainer reviews error:', err);
    return res.status(500).json({ success: false, error: 'Unable to load reviews.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const trainerId = req.params.id;

    if (!trainerId || trainerId.length !== 24) {
      return res.status(400).json({ success: false, error: 'Invalid trainer ID format.' });
    }

    const trainer = await Trainer.findById(trainerId).select('-password');

    if (!trainer) {
      return res.status(404).json({ success: false, error: 'Trainer not found.' });
    }

    return res.status(200).json({ success: true, trainer });
  } catch (err) {
    console.error('❌ Fetch Trainer Profile Error:', err);
    return res.status(500).json({ success: false, error: 'Server error while fetching trainer profile.' });
  }
});

// 📍 PUT: Update trainer profile details securely
router.put('/:id', requireAuth, requireRole('trainer'), async (req, res) => {
  try {
    const { id } = req.params;
    if (String(req.user.id) !== String(id)) {
      return res.status(403).json({ success: false, error: 'You can only update your own profile.' });
    }
    const updates = { ...req.body };
    const allowed = ['name', 'title', 'gym', 'locationName', 'experience', 'languages', 'trainingStyle', 'specialties', 'bio', 'pricing'];
    Object.keys(updates).forEach((key) => { if (!allowed.includes(key)) delete updates[key]; });

    if (updates.name !== undefined && typeof updates.name === 'string' && !updates.name.trim()) {
      delete updates.name;
    }

    const updatedTrainer = await Trainer.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedTrainer) {
      return res.status(404).json({ success: false, error: 'Trainer profile not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      trainer: updatedTrainer
    });
  } catch (err) {
    console.error('❌ Trainer Profile Update Error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Server error while updating profile.' });
  }
});

// ── REGISTER (Sign Up) ────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { 
      name, email, password, 
      gym, experience, location, 
      title, specialties, pricing,
      locationCoords 
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
    }

    const existingTrainer = await Trainer.findOne({ email: email.toLowerCase() });
    if (existingTrainer) {
      return res.status(400).json({ success: false, error: 'Trainer with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const coords = Array.isArray(locationCoords) && locationCoords.length === 2 
      ? [parseFloat(locationCoords[0]), parseFloat(locationCoords[1])]
      : [72.8777, 19.0760];

    const newTrainer = new Trainer({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      title: title || 'Elite Strength & Conditioning Coach',
      gym: gym || '',
      locationName: location || 'Mumbai, India',
      location: {
        type: 'Point',
        coordinates: coords
      },
      experience: experience || '8 years',
      specialties: specialties || [],
      pricing: {
        personalTraining: pricing?.personalTraining || 2500,
        videoConsultation: pricing?.videoConsultation || 1500,
        workoutProgramming: 1000
      }
    });

    const savedTrainer = await newTrainer.save();

    return res.status(201).json({
      success: true,
      message: 'Trainer registered successfully!',
      token: signToken(savedTrainer, 'trainer'),
      user: {
        _id: savedTrainer._id,
        id: savedTrainer._id,
        name: savedTrainer.name,
        email: savedTrainer.email,
        title: savedTrainer.title,
        gym: savedTrainer.gym,
        specialties: savedTrainer.specialties,
        pricing: savedTrainer.pricing,
        role: 'trainer'
      }
    });
  } catch (err) {
    console.error('❌ Trainer Registration Error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Server error during trainer registration.' });
  }
});

// ── SIGN IN ───────────────────────────────────────────────────────────────────
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const trainer = await Trainer.findOne({ email: email.toLowerCase() });
    if (!trainer) {
      return res.status(401).json({ success: false, error: 'Invalid trainer email or password.' });
    }

    const isMatch = await bcrypt.compare(password, trainer.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid trainer email or password.' });
    }
    if (trainer.accountStatus === 'suspended') {
      return res.status(403).json({ success: false, error: 'This account has been suspended. Contact support.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Signed in successfully!',
      token: signToken(trainer, 'trainer'),
      user: {
        _id: trainer._id,
        id: trainer._id,
        name: trainer.name,
        email: trainer.email,
        title: trainer.title,
        gym: trainer.gym,
        specialties: trainer.specialties,
        pricing: trainer.pricing,
        role: 'trainer'
      }
    });
  } catch (err) {
    console.error('❌ Trainer Signin Error:', err);
    return res.status(500).json({ success: false, error: 'Server error during trainer sign in.' });
  }
});

export default router;
