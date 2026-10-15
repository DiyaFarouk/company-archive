const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

// same name allowed in different companies, not twice in one
departmentSchema.index({ company: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Department", departmentSchema);