import dotenv from "dotenv";
import mongoose from "mongoose";
import { Gym, Event } from "../models/Feature.js";

dotenv.config();
const future = (days, hour) => { const value = new Date(); value.setDate(value.getDate() + days); value.setHours(hour, 0, 0, 0); return value; };

async function seed() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required.");
  await mongoose.connect(process.env.MONGODB_URI);
  if (await Gym.countDocuments() || await Event.countDocuments()) {
    console.log("Events or gyms already exist; no seed data was created.");
    return;
  }
  await Gym.insertMany([
    { name: "RepUps Performance Lab", city: "Mumbai", location: "Bandra West, Mumbai", address: "Bandra West, Mumbai", rating: 4.8, reviewCount: 128, openingHours: "Open 24/7", facilities: ["Strength", "Recovery", "Mobility"], tags: ["Performance", "Strength"], memberships: [{ name: "Monthly Performance", type: "membership", price: 2499, durationDays: 30, billingCycle: "Monthly", description: "Full gym access", included: ["Gym access", "Mobility zone"] }, { name: "Single Day Pass", type: "day-pass", price: 399, durationDays: 1, description: "One day of full gym access", included: ["Gym access"] }] },
    { name: "Stronger SF Gym", city: "Mumbai", location: "Andheri East, Mumbai", address: "Andheri East, Mumbai", rating: 4.6, reviewCount: 84, openingHours: "Open · Closes 10 PM", facilities: ["Strength", "Cardio", "Mobility"], tags: ["Strength", "Cardio"], memberships: [{ name: "Basic Monthly", type: "membership", price: 1999, durationDays: 30, billingCycle: "Monthly", description: "Core gym access", included: ["Gym access"] }, { name: "Weekend Pass", type: "day-pass", price: 599, durationDays: 3, description: "Three-day pass", included: ["Gym access"] }] },
  ]);
  await Event.insertMany([
    { name: "Mobility Workshop", description: "A practical session for improving joint range of motion and movement quality.", startsAt: future(14, 10), endAt: future(14, 12), city: "Mumbai", location: "Bandra West Studio, Mumbai", organizer: "RepUps", capacity: 40, ticketTypes: [{ name: "General Admission", price: 599, quantity: 35, description: "Workshop admission" }, { name: "VIP", price: 1099, quantity: 5, description: "Priority seating and Q&A" }], included: ["Mobility session", "Coach Q&A"], tags: ["Mobility"], status: "active" },
    { name: "Posture & Performance Seminar", description: "Learn how posture, strength, and daily habits shape your performance.", startsAt: future(21, 14), endAt: future(21, 17), city: "Mumbai", location: "Andheri Convention Hall, Mumbai", organizer: "RepUps", capacity: 80, ticketTypes: [{ name: "General Admission", price: 799, quantity: 80, description: "Seminar admission" }], included: ["Seminar", "Digital notes"], tags: ["Posture", "Performance"], status: "active" },
  ]);
  console.log("Development events and gyms seeded.");
}

seed().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => mongoose.disconnect());
