const mongoose = require("mongoose");
const companySchema = new mongoose.Schema({
    description: String,
logo: String,
website: String,
location: String,
industry: String,
isVerified: { type: Boolean, default: false },
}, { timestamps: true })


const Company = mongoose.model("Company",companySchema);
module.exports = Company;