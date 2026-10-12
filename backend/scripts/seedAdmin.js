require("dotenv").config();
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const {connectDB} = require("../config/db");
const User = require("../models/user.model");

const seedAdmin = async () => {
  try {
    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      console.log("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env first");
      process.exit(1);
    }

    await connectDB();

    const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
    if (existing) {
      console.log("A user with that email already exists. Nothing changed.");
      await mongoose.disconnect();
      process.exit(0);
    }

    await User.create({
      name: ADMIN_NAME || "Super Admin",
      email: ADMIN_EMAIL,
      password: await bcrypt.hash(ADMIN_PASSWORD, 10),
      role: "admin",
    });

    console.log("Admin created successfully");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seedAdmin();