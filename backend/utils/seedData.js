require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Slot = require("../models/Slot");
const connectDatabase = require("../config/database");

const seedData = async () => {
  try {
    await connectDatabase();

    // Clear existing data
    await User.deleteMany({});
    await Slot.deleteMany({});

    // Create admin user
    const adminUser = new User({
      name: "Admin User",
      email: "admin@example.com",
      password: "Passw0rd!",
      role: "admin",
      isVerified: true,
    });
    await adminUser.save();

    // Create patient user
    const patientUser = new User({
      name: "Patient User",
      email: "patient@example.com",
      password: "Passw0rd!",
      role: "patient",
      isVerified: true,
    });
    await patientUser.save();

    // Generate slots for next 30 days
    const slots = [];
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    for (let day = 0; day < 30; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + day);

      // Skip weekends
      if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
        continue;
      }

      // Generate slots from 9:00 AM to 5:00 PM (30-minute intervals)
      for (let hour = 9; hour < 17; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const slotStart = new Date(currentDate);
          slotStart.setHours(hour, minute, 0, 0);

          const slotEnd = new Date(slotStart);
          slotEnd.setMinutes(slotStart.getMinutes() + 30);

          slots.push({
            startAt: slotStart,
            endAt: slotEnd,
            isBooked: false,
          });
        }
      }
    }

    await Slot.insertMany(slots);

    console.log("Database seeded successfully!");
    console.log(`Created ${slots.length} slots`);
    console.log("Admin: admin@example.com / Passw0rd!");
    console.log("Patient: patient@example.com / Passw0rd!");

    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
};

seedData();
