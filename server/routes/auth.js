import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { signToken } from "../middleware/auth.js";

const router = express.Router();

// Public registration deliberately allows only client and trainer accounts.
router.post("/register", async (req, res) => {
  try {
    const { role, name, email, username, password, gym, experience, specialties, weight, height, age, fitnessLevel, goal } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: "Please fill in all required fields (Name, Email, Password)." });
    }
    if (role && !["client", "trainer"].includes(role)) {
      return res.status(400).json({ success: false, error: "Invalid account role." });
    }

    const normalizedEmail = email.toLowerCase();
    if (await User.findOne({ email: normalizedEmail })) {
      return res.status(400).json({ success: false, error: "An account with this email already exists." });
    }
    const normalizedUsername = username?.trim().toLowerCase();
    if (normalizedUsername && !/^[a-z0-9_.-]{3,32}$/.test(normalizedUsername)) {
      return res.status(400).json({ success: false, error: "Username must be 3–32 letters, numbers, dots, underscores, or hyphens." });
    }
    if (normalizedUsername && await User.findOne({ username: normalizedUsername })) {
      return res.status(400).json({ success: false, error: "That username is already in use." });
    }

    const accountRole = role || "client";
    const savedUser = await new User({
      role: accountRole,
      name,
      email: normalizedEmail,
      username: normalizedUsername,
      password: await bcrypt.hash(password, 10),
      gym: accountRole === "trainer" ? gym : undefined,
      experience: accountRole === "trainer" ? experience : undefined,
      specialties: accountRole === "trainer" ? specialties || [] : [],
      weight: accountRole === "client" ? Number(weight) || null : undefined,
      height: accountRole === "client" ? Number(height) || null : undefined,
      age: accountRole === "client" ? Number(age) || null : undefined,
      fitnessLevel: accountRole === "client" ? fitnessLevel : undefined,
      goal: accountRole === "client" ? goal : undefined,
    }).save();

    return res.status(201).json({
      success: true,
      message: "Account created successfully!",
      token: signToken(savedUser),
      user: { _id: savedUser._id, id: savedUser._id, name: savedUser.name, email: savedUser.email, role: savedUser.role },
    });
  } catch (err) {
    console.error("Registration Error:", err);
    return res.status(500).json({ success: false, error: "Server error during registration." });
  }
});

router.post("/signin", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, error: "Invalid email or password." });
    }
    if (role && user.role !== role) {
      return res.status(400).json({ success: false, error: `This account is registered as a ${user.role}. Please select the correct tab.` });
    }
    if (user.accountStatus === "suspended") {
      return res.status(403).json({ success: false, error: "This account has been suspended. Contact support." });
    }

    return res.status(200).json({
      success: true,
      message: "Signed in successfully!",
      token: signToken(user),
      user: { _id: user._id, id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("Sign In Error:", err);
    return res.status(500).json({ success: false, error: "Server error during sign in." });
  }
});

export default router;
