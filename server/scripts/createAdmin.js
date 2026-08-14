import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";

const [name, email, password] = process.argv.slice(2);
if (!name || !email || !password) throw new Error('Usage: npm run admin:create -- "Name" email@example.com password');
if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI must be set.");

await mongoose.connect(process.env.MONGODB_URI);
await User.findOneAndUpdate(
  { email: email.toLowerCase() },
  { $set: { name, email: email.toLowerCase(), password: await bcrypt.hash(password, 12), role: "admin", accountStatus: "active", deletedAt: null } },
  { upsert: true, new: true, setDefaultsOnInsert: true }
);
await mongoose.disconnect();
console.log(`Admin ready: ${email}`);
