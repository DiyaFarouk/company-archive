const Company = require("../models/company.model")

const createCompany = async (req,res) =>{
    try {
        const { description, logo, website, location, industry } =req.body;
        const company = new Company({
            description,
            logo,
            website,
            location,
            industry
        })
        await company.save()
        res.status(201).json({ message: "Company created successfully", company })
        } catch (error){
            res.status(500).json({ message :"Error creating company", error: error.message})
    }
}

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
            return res.status(404).json({message: "Comapny not found"})
        }
        res.status(200).json({ company })
    }catch (error) {
        res.status(500).json({ message: "Error fetching company", error: error.message})
    }
}


module.exports = { createCompany, getAllCompanies, getCompanyById }
