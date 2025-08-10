import React from "react";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    window.location.href = "/login";
    return null;
  }

  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="error-container">
        <div className="error-card">
          <h2>Access Denied</h2>
          <p>You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
