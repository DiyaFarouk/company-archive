const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    }, 
    email: {
        type: String,
        required: true,
        unique:true
    },
    job_title: {
        type:String,
        required: true
    },
    salary:{
        type:String,
        required:true
    }},{ timestamps:true }
)
const Employee = mongoose.model("Employee",employeeSchema)
module.exports= Employee