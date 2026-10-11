const Company = require("../models/company.model.js");

const requireActiveCompany = async (req, res, next) => {
  try {
    // Find the company that belongs to the logged-in user
    const company = await Company.findOne({ user: req.user._id });

    if (!company) {
      return res.status(403).json({ message: "Company account not found" });
    }

    // Catches a company that was approved at login but suspended since
    if (company.status !== "active") {
      return res.status(403).json({ message: "Company account is not active" });
    }

    // Controllers will use req.company._id to scope every query
    req.company = company;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = requireActiveCompany;