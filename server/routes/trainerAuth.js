import express from 'express';
import bcrypt from 'bcryptjs';
import Trainer from '../models/Trainer.js';
import { signToken } from '../middleware/auth.js';

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
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

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