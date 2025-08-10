import React, { createContext, useContext, useReducer, useEffect } from "react";
import api from "../utils/api";

const AuthContext = createContext();

const initialState = {
  user: null,
  loading: true,
  error: null,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_USER":
      return { ...state, user: action.payload, loading: false, error: null };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    case "LOGOUT":
      return { ...state, user: null, loading: false, error: null };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await api.get("/auth/me");
      dispatch({ type: "SET_USER", payload: response.data.user });
    } catch (error) {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const login = async (credentials) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await api.post("/auth/login", credentials);
      dispatch({ type: "SET_USER", payload: response.data.user });
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.error?.message || "Login failed";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await api.post("/auth/register", userData);
      dispatch({ type: "SET_LOADING", payload: false });
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.error?.message || "Registration failed";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      throw error;
    }
  };

  const verifyOTP = async (userId, otp) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await api.post("/auth/verify-otp", { userId, otp });
      dispatch({ type: "SET_USER", payload: response.data.user });
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.error?.message || "OTP verification failed";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      throw error;
    }
  };

  const resendOTP = async (userId) => {
    try {
      const response = await api.post("/auth/resend-otp", { userId });
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.error?.message || "Failed to resend OTP";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      dispatch({ type: "LOGOUT" });
    }
  };

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  const value = {
    ...state,
    login,
    register,
    verifyOTP,
    resendOTP,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
