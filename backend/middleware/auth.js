const jwt = require("jsonwebtoken");
const User = require("../models/user.model.js");

// Step 1: figure out who is making the request
const authenticate = async (req, res, next) => {
  try {
    // The client sends:  Authorization: Bearer <token>
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // "Bearer abc123".split(" ") -> ["Bearer", "abc123"], so [1] is the token
    const token = header.split(" ")[1];

    // Throws an error if the token is fake, tampered with, or expired.
    // If valid, returns what we put inside it at login: { id, role, iat, exp }
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // A valid token isn't enough: the user might have been deleted since.
    const user = await User.findById(payload.id);
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Make the user available to every function after this one
    req.user = user;
    next();
  } catch (error) {
    // These two error names come from the jsonwebtoken library
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    // Anything else (like the database being down) is a real server problem
    next(error);
  }
};

// Step 2: check the user's role is allowed on this route
// This is a function that RETURNS a middleware, so you can pass roles in:
//   requireRole("admin")  or  requireRole("admin", "company")
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
};

module.exports = { authenticate, requireRole };