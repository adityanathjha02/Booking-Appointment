const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        error: {
          code: "NO_TOKEN",
          message: "Access denied. No token provided.",
        },
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        error: {
          code: "INVALID_TOKEN",
          message: "Invalid token.",
        },
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      error: {
        code: "INVALID_TOKEN",
        message: "Invalid token.",
      },
    });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      error: {
        code: "ACCESS_DENIED",
        message: "Admin access required.",
      },
    });
  }
  next();
};

const isPatient = (req, res, next) => {
  if (req.user.role !== "patient") {
    return res.status(403).json({
      error: {
        code: "ACCESS_DENIED",
        message: "Patient access required.",
      },
    });
  }
  next();
};

module.exports = { auth, isAdmin, isPatient };
