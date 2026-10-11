const Company = require("../models/company.model")



const getAllCompanies = async (req, res) =>{
    try{
        const companies = await Company.find()
        res.status(200).json({ companies})
    } catch (error){
        res.status(500).json({ message: "Error fetching companies", error: error.message})
    }
}
const getCompanyById = async (req, res) =>{
    try{
        const company = await Company.findById(req.params.id)
        if(!company) {
            return res.status(404).json({message: "Company not found"})
        }
        res.status(200).json({ company })
    }catch (error) {
        res.status(500).json({ message: "Error fetching company", error: error.message})
    }
}
const updateCompany = async (req, res) =>{
    try{
        const updatedCompany = await Company.findByIdAndUpdate(req.params.id, req.body, { new:true })
        res.status(200).json(updatedCompany)
    } catch (error){
        res.status(500).json({ message: "Error in update", error: error.message})
    }
}
const deleteCompanyById = async (req, res) => {
  const company = await Company.findById(req.params.id);
  if (!company) return res.status(404).json({ message: "Company not found" });

  await Employee.deleteMany({ company: company._id });
  await User.findByIdAndDelete(company.user);
  await company.deleteOne();

  res.status(200).json({ message: "Company and all its data deleted" });
};


module.exports = { getAllCompanies, getCompanyById, updateCompany, deleteCompanyById }
