const Department = require("../models/department.model");
const Employee = require("../models/employee.model");

const createDepartment = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || typeof name !== "string") {
      return res.status(400).json({ message: "Department name is required" });
    }
    const department = await Department.create({
      company: req.company._id, // from middleware, never from body
      name,
      description,
    });
    res.status(201).json({ message: "Department created", department });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Department already exists" });
    }
    console.error(error);
    res.status(500).json({ message: "Error creating department" });
  }
};

const getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find({ company: req.company._id }).sort({ name: 1 });
    res.status(200).json({ departments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching departments" });
  }
};

const getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findOne({
      _id: req.params.id,
      company: req.company._id,
    });
    if (!department) return res.status(404).json({ message: "Department not found" });

    const employees = await Employee.find({
      company: req.company._id,
      department: department._id,
    });
    res.status(200).json({ department, employees });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching department" });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const { name, description } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;

    const department = await Department.findOneAndUpdate(
      { _id: req.params.id, company: req.company._id },
      updates,
      { returnDocument: "after", runValidators: true }
    );
    if (!department) return res.status(404).json({ message: "Department not found" });
    res.status(200).json({ department });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Department name already exists" });
    }
    console.error(error);
    res.status(500).json({ message: "Error updating department" });
  }
};

const deleteDepartmentById = async (req, res) => {
  try {
    const department = await Department.findOne({
      _id: req.params.id,
      company: req.company._id,
    });
    if (!department) return res.status(404).json({ message: "Department not found" });

    const inUse = await Employee.exists({
      company: req.company._id,
      department: department._id,
    });
    if (inUse) {
      return res.status(409).json({
        message: "Department still has employees. Reassign them first.",
      });
    }

    await department.deleteOne();
    res.status(200).json({ message: "Department deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting department" });
  }
};

module.exports = {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartmentById,
};