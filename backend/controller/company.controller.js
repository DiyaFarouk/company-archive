const Company = require("../models/company.model.js");
const Employee = require("../models/employee.model.js");
const User = require("../models/user.model.js");

/* ---------------------------------------------------------
   ADMIN FUNCTIONS (used in admin.routes.js)
--------------------------------------------------------- */

// List all companies, newest first, with the owner's name and email
const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    res.status(200).json({ companies });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching companies" });
  }
};

// Get one company by id
const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id).populate("user", "name email");
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    res.status(200).json({ company });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching company" });
  }
};

// Approve, suspend, or set a company back to pending
const updateCompanyStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["pending", "active", "suspended"].includes(status)) {
      return res.status(400).json({ message: "Status must be pending, active or suspended" });
    }

    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    res.status(200).json({ message: `Company is now ${status}`, company });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating company status" });
  }
};

// Permanently delete a company, its employees, and its login account
const deleteCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    await Employee.deleteMany({ company: company._id });
    await User.findByIdAndDelete(company.user);
    await company.deleteOne();

    res.status(200).json({ message: "Company and all its data deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting company" });
  }
};

/* ---------------------------------------------------------
   COMPANY SELF-SERVICE (used in company.routes.js)
--------------------------------------------------------- */

// A company views its own profile.
// req.company was already loaded by the requireActiveCompany middleware.
const getMyCompany = (req, res) => {
  res.status(200).json({ company: req.company });
};

// A company edits its own profile, but only the fields listed here
const updateMyCompany = async (req, res) => {
  try {
    const allowed = ["name", "description", "logo", "website", "location", "industry"];
    const updates = {};

    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const company = await Company.findByIdAndUpdate(req.company._id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ company });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating company" });
  }
};

module.exports = {
  getAllCompanies,
  getCompanyById,
  updateCompanyStatus,
  deleteCompanyById,
  getMyCompany,
  updateMyCompany,
};