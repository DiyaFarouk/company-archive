const Employee = require("../models/employee.model.js")

const createEmployee = async (req,res) =>{
    try {
        const { name, email, job_title, salary} =req.body;
        const employee = new Employee({
           name,
           email,
           job_title,
           salary
        })
        await employee.save()
        res.status(201).json({ message: "Employee created successfully", employee })
        } catch (error){
            res.status(500).json({ message :"Error creating employee", error: error.message})
    }
}

const getAllEmployees = async (req, res) =>{
    try{
        const employees = await Employee.find()
        res.status(200).json({ employees})
    } catch (error){
        res.status(500).json({ message: "Error fetching employees", error: error.message})
    }
}
const getEmployeeById = async (req, res) =>{
    try{
        const employee = await Employee.findById(req.params.id)
        if(!employee) {
            return res.status(404).json({message: "Employee not found"})
        }
        res.status(200).json({ employee })
    }catch (error) {
        res.status(500).json({ message: "Error fetching employee", error: error.message})
    }
}
const updateEmployee = async (req, res) =>{
    try{
        const updatedemployee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new:true })
        res.status(200).json(updatedemployee)
    } catch (error){
        res.status(500).json({ message: "Error in update", error: error.message})
    }
}
const deleteEmployeeById = async (req, res) =>{
    try{
        const deleteemployee = await Employee.findByIdAndDelete(req.params.id)
        res.status(200).json(deleteemployee)
    } catch (error){
        res.status(500).json({ message: "Error in deleting employee", error:error.message})
    }
}


module.exports ={ createEmployee, getAllEmployees, getEmployeeById, updateEmployee, deleteEmployeeById}