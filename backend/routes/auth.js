const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { validateRegister, validateLogin } = require("../middleware/validation");
const { auth } = require("../middleware/auth");
const passport = require("../config/passport");
const router = express.Router();

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Register
router.post("/register", validateRegister, async (req, res) => {
  try {
    const { name, email, password, role = "patient" } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        error: {
          code: "USER_EXISTS",
          message: "User already exists with this email.",
        },
      });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const user = new User({
      name,
      email,
      password,
      role,
      otp: {
        code: otp,
        expiresAt: otpExpiry,
      },
    });

    await user.save();

    // In production, send OTP via email/SMS
    console.log(`OTP for ${email}: ${otp}`);

    res.status(201).json({
      message: "Registration successful. Please verify your OTP.",
      userId: user._id,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      error: {
        code: "REGISTRATION_ERROR",
        message: "Registration failed. Please try again.",
      },
    });
  }
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found.",
        },
      });
    }

    if (!user.otp.code || user.otp.expiresAt < new Date()) {
      return res.status(400).json({
        error: {
          code: "OTP_EXPIRED",
          message: "OTP has expired.",
        },
      });
    }

    if (user.otp.code !== otp) {
      return res.status(400).json({
        error: {
          code: "INVALID_OTP",
          message: "Invalid OTP.",
        },
      });
    }

    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      message: "OTP verified successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({
      error: {
        code: "VERIFICATION_ERROR",
        message: "OTP verification failed.",
      },
    });
  }
});

// Resend OTP
router.post("/resend-otp", async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found.",
        },
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        error: {
          code: "ALREADY_VERIFIED",
          message: "User is already verified.",
        },
      });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    user.otp = {
      code: otp,
      expiresAt: otpExpiry,
    };

    await user.save();

    console.log(`New OTP for ${user.email}: ${otp}`);

    res.json({
      message: "OTP sent successfully.",
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({
      error: {
        code: "RESEND_ERROR",
        message: "Failed to resend OTP.",
      },
    });
  }
});

// Login
router.post("/login", validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password.",
        },
      });
    }

    if (!user.isVerified) {
      return res.status(400).json({
        error: {
          code: "NOT_VERIFIED",
          message: "Please verify your account first.",
          userId: user._id,
        },
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: {
        code: "LOGIN_ERROR",
        message: "Login failed. Please try again.",
      },
    });
  }
});

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_URL}/login`,
  }),
  async (req, res) => {
    try {
      const token = jwt.sign(
        { id: req.user._id, role: req.user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.redirect(`${process.env.CLIENT_URL}/dashboard`);
    } catch (error) {
      console.error("Google OAuth callback error:", error);
      res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
    }
  }
);

// Logout
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logout successful" });
});

// Get current user
router.get("/me", auth, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

module.exports = router;
