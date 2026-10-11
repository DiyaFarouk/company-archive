// company.model.js
const mongoose = require("mongoose");
const companySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  name: { type: String, required: true, trim: true },
  description: String,
  logo: String,
  website: String,
  location: String,
  industry: String,
  status: { type: String, enum: ["pending", "active", "suspended"], default: "pending" },
  isVerified: { type: Boolean, default: false },
}, { timestamps: true });

const Company = mongoose.model("Company",companySchema);
module.exports = Company;