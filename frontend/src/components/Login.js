import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isOTPStep, setIsOTPStep] = useState(false);
  const [userId, setUserId] = useState(null);
  const [otpValue, setOtpValue] = useState("");
  const { login, verifyOTP, resendOTP, error, loading, clearError } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    try {
      await login(formData);
      window.location.href = "/dashboard";
    } catch (error) {
      if (error.response?.data?.error?.code === "NOT_VERIFIED") {
        setUserId(error.response.data.error.userId);
        setIsOTPStep(true);
      }
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
    try {
      await resendOTP(userId);
      alert("OTP sent successfully!");
    } catch (error) {
      // Error is handled in context
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${
      process.env.REACT_APP_API_URL || "http://localhost:5000/api"
    }/auth/google`;
  };

  if (isOTPStep) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Verify OTP</h2>
            <p>Please enter the OTP sent to your email</p>
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
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>

          <div className="auth-footer">
            <p>Didn't receive OTP?</p>
            <button
              type="button"
              onClick={handleResendOTP}
              className="btn btn-link"
            >
              Resend OTP
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
          <h2>Welcome Back</h2>
          <p>Sign in to your account</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
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
              placeholder="Password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              className="form-input"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="divider">
          <span>OR</span>
        </div>

        <button onClick={handleGoogleLogin} className="btn btn-google">
          <svg
            className="google-icon"
            viewBox="0 0 24 24"
            width="20"
            height="20"
          >
            <path
              fill="#4285f4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34a853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#fbbc05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#ea4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="auth-footer">
          <p>
            Don't have an account? <a href="/register">Create account</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
