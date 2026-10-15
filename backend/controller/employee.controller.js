const Employee = require("../models/employee.model.js")
const Department = require("../models/department.model.js")
const cloudinary = reuire("../config/cloudinary.js")

const resolveDepartment = async (departmentId, companyId) => {
  if (!departmentId) return null;
  const department = await Department.findOne({ _id: departmentId, company: companyId });
  if (!department) return undefined;
  return department._id;
};

const createEmployee = async (req, res) => {
  try {
    const { name, email, job_title, salary , cv} = req.body;
    let cloudinaryResponse = null;
    if (cv) {
      cloudinaryResponse = await cloudinary.uploader.upload(cv, {
        folder: "company-archive/cvs",
        public_id: Date.now().toString()
      })
    }
    const department = await resolveDepartment(req.body.department, req.company._id);
    if (department === undefined) return res.status(400).json({ message: "Department not found" });
    const employee = await Employee.create({
      company: req.company._id, // from middleware, never from body
      name, email, job_title, salary, department, cv: cloudinaryResponse ? cloudinaryResponse.secure_url : null
    });
    await employee.populate("department", "name");
    res.status(201).json({ message: "Employee created successfully", employee });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "Employee email already exists" });
    console.error(error);
    res.status(500).json({ message: "Error creating employee" });
  }
};

const getAllEmployees = async (req, res) => {
  const employees = await Employee.find({ company: req.company._id }).populate("department", "name");
  res.status(200).json({ employees });
};

const getEmployeeById = async (req, res) => {
  const employee = await Employee.findOne({ _id: req.params.id, company: req.company._id }).populate("department", "name");
  if (!employee) return res.status(404).json({ message: "Employee not found" });
  res.status(200).json({ employee });
};

const updateEmployee = async (req, res) => {
  const { name, email, job_title, salary } = req.body; // whitelist
  const updates = { name, email, job_title, salary };
  if (req.body.department !== undefined) {
    const department = await resolveDepartment(req.body.department, req.company._id);
    if (department === undefined) return res.status(400).json({ message: "Department not found" });
    updates.department = department;
  }
  const employee = await Employee.findOneAndUpdate(
    { _id: req.params.id, company: req.company._id },
    updates,
    { new: true, runValidators: true }
  ).populate("department", "name");
  if (!employee) return res.status(404).json({ message: "Employee not found" });
  res.status(200).json({ employee });
};

const deleteEmployeeById = async (req, res) => {
  const employee = await Employee.findOneAndDelete({ _id: req.params.id, company: req.company._id });
  if (!employee) return res.status(404).json({ message: "Employee not found" });
  res.status(200).json({ message: "Employee deleted" });
};

module.exports ={ createEmployee, getAllEmployees, getEmployeeById, updateEmployee, deleteEmployeeById}