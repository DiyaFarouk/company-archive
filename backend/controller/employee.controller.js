const Employee = require("../models/employee.model.js")

const createEmployee = async (req, res) => {
  try {
    const { name, email, job_title, salary } = req.body;
    const employee = await Employee.create({
      company: req.company._id, // from middleware, never from body
      name, email, job_title, salary,
    });
    res.status(201).json({ message: "Employee created successfully", employee });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "Employee email already exists" });
    console.error(error);
    res.status(500).json({ message: "Error creating employee" });
  }
};

const getAllEmployees = async (req, res) => {
  const employees = await Employee.find({ company: req.company._id });
  res.status(200).json({ employees });
};

const getEmployeeById = async (req, res) => {
  const employee = await Employee.findOne({ _id: req.params.id, company: req.company._id });
  if (!employee) return res.status(404).json({ message: "Employee not found" });
  res.status(200).json({ employee });
};

const updateEmployee = async (req, res) => {
  const { name, email, job_title, salary } = req.body; // whitelist
  const employee = await Employee.findOneAndUpdate(
    { _id: req.params.id, company: req.company._id },
    { name, email, job_title, salary },
    { new: true, runValidators: true }
  );
  if (!employee) return res.status(404).json({ message: "Employee not found" });
  res.status(200).json({ employee });
};

const deleteEmployeeById = async (req, res) => {
  const employee = await Employee.findOneAndDelete({ _id: req.params.id, company: req.company._id });
  if (!employee) return res.status(404).json({ message: "Employee not found" });
  res.status(200).json({ message: "Employee deleted" });
};

module.exports ={ createEmployee, getAllEmployees, getEmployeeById, updateEmployee, deleteEmployeeById}