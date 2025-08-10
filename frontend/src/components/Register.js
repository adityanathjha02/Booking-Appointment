import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "patient",
  });
  const [isOTPStep, setIsOTPStep] = useState(false);
  const [userId, setUserId] = useState(null);
  const [otpValue, setOtpValue] = useState("");
  const [countdown, setCountdown] = useState(0);
  const { register, verifyOTP, resendOTP, error, loading, clearError } =
    useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    try {
      const response = await register(formData);
      setUserId(response.userId);
      setIsOTPStep(true);
    } catch (error) {
      // Error is handled in context
    }
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();

    try {
      await verifyOTP(userId, otpValue);
      window.location.href = "/dashboard";
    } catch (error) {
      // Error is handled in context
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    try {
      await resendOTP(userId);
      alert("OTP sent successfully!");
      setCountdown(30);

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      // Error is handled in context
    }
  };

  if (isOTPStep) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Verify Your Account</h2>
            <p>We've sent a 6-digit OTP to {formData.email}</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleOTPSubmit} className="auth-form">
            <div className="form-group">
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value)}
                maxLength="6"
                required
                className="form-input"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify Account"}
            </button>
          </form>

          <div className="auth-footer">
            <p>Didn't receive OTP?</p>
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={countdown > 0}
              className="btn btn-link"
            >
              {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Join us today</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <input
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <input
              type="email"
              placeholder="Email address"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              placeholder="Password (min 8 characters)"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              minLength="8"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              className="form-input"
            >
              <option value="patient">Patient</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account? <a href="/login">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
