const User = require("../models/user.model.js")
const bcrypt = require("bcrypt")

const signUp = async (req, res) =>{
    try{
        const { name, email, password, role} = req.body;
        const hashedPassword = await bcrypt.hash(password, 10)
        const user = new User({
            name,
            email,
            hashedPassword,
            role    
        })
        await user.save()
        res.status(201).json({ message: "User created successfully" })
    } catch (error) {
        res.status(500).json({ message: "Error creating user", error })
    }
}

const signIn = async (req, res) => {
    try{
        const { email, password } = req.body;
        const user = await User.findOne({ email })
        if(!user){
            return res.status(404).json({ message: "User not found"})
        }
        res.status(200).json({message:"sign in successful"})
    } catch(error){
        res.status(500).json({ message:"Error signing in", error:error.message})
    }
}

module.exports = { signUp, signIn}