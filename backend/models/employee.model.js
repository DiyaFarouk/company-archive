const mongoose = require("mongoose");

// employee.model.js
const employeeSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  job_title: { type: String, required: true },
  salary: { type: Number, required: true },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    default: null,
  },
  cv: { type: String, default: null },
}, { timestamps: true });

employeeSchema.index({ company: 1, email: 1 }, { unique: true });
const Employee = mongoose.model("Employee",employeeSchema)
module.exports= Employee