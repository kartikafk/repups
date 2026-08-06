import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { signToken } from "../middleware/auth.js";
const router = express.Router();

// ── REGISTER (Sign Up) ────────────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const {
      role,
      name,
      email,
      password,
      gym,
      experience,
      specialties,
      weight,
      height,
      age,
      fitnessLevel,
      goal,
    } = req.body;
    

    // 1. Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Please fill in all required fields (Name, Email, Password).",
      });
    }

    // 2. Check existing user
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "An account with this email already exists.",
      });
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Build user record based on role
    const newUser = new User({
      role: role || "client",
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      gym: role === "trainer" ? gym : undefined,
      experience: role === "trainer" ? experience : undefined,
      specialties: role === "trainer" ? specialties || [] : [],
      weight: role === "client" ? Number(weight) || null : undefined,
      height: role === "client" ? Number(height) || null : undefined,
      age: role === "client" ? Number(age) || null : undefined,
      fitnessLevel: role === "client" ? fitnessLevel : undefined,
      goal: role === "client" ? goal : undefined,
    });

    const savedUser = await newUser.save();

    return res.status(201).json({
      success: true,
      message: "Account created successfully!",
      token: signToken(savedUser),
      user: {
        _id: savedUser._id, // 🔑 Added standard Mongoose _id
        id: savedUser._id,  // 🔑 Retained alias for compatibility
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
      },
    });
  } catch (err) {
    console.error("❌ Registration Error:", err);
    return res.status(500).json({
      success: false,
      error: "Server error during registration.",
    });
  }
});

// ── SIGN IN (Log In) ─────────────────────────────────────────────────────────
router.post("/signin", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required.",
      });
    }

    // 1. Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password.",
      });
    }

    // 2. Validate role match (optional check)
    if (role && user.role !== role) {
      return res.status(400).json({
        success: false,
        error: `This account is registered as a ${user.role}. Please select the correct tab.`,
      });
    }

    // 3. Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Signed in successfully!",
      token: signToken(user),
      user: {
        _id: user._id, // 🔑 Added standard Mongoose _id
        id: user._id,  // 🔑 Retained alias for compatibility
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("❌ Sign In Error:", err);
    return res.status(500).json({
      success: false,
      error: "Server error during sign in.",
    });
  }
});

export default router;