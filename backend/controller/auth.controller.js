const User = require("../models/user.model.js");
const Company = require("../models/company.model.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const signUp = async (req, res) => {
  let user;
  try {
    const { name, email, password, companyName } = req.body;

    if (!name || !email || !password || !companyName) {
      return res.status(400).json({ message: "Name, email, password and company name are required" });
    }
    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "Invalid input" });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "company", // set by the server, never from the client
    });

    await Company.create({
      user: user._id,
      name: companyName,
      // status defaults to "pending" until the admin approves
    });

    res.status(201).json({
      message: "Registration successful. Your account is awaiting admin approval.",
    });
  } catch (error) {
    // roll back the user if the company creation failed
    if (user) await User.findByIdAndDelete(user._id).catch(() => {});

    if (error.code === 11000) {
      return res.status(409).json({ message: "Email already in use" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "Invalid input" });
    }
    console.error(error);
    res.status(500).json({ message: "Error creating account" });
  }
};

const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "Invalid input" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    const valid = user && (await bcrypt.compare(password, user.password));

    if (!valid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // companies must be approved before they can log in
    let company = null;
    if (user.role === "company") {
      company = await Company.findOne({ user: user._id });

      if (!company) {
        return res.status(403).json({ message: "Account not found or removed" });
      }
      if (company.status === "pending") {
        return res.status(403).json({ message: "Your account is awaiting admin approval" });
      }
      if (company.status === "suspended") {
        return res.status(403).json({ message: "Your account has been suspended" });
      }
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Sign in successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ...(company && { companyId: company._id, companyName: company.name }),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error signing in" });
  }
};



module.exports = { signUp, signIn };