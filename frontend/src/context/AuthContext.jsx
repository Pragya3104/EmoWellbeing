import React, { createContext, useContext, useState } from "react";
import { logoutUser } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("emowell_user"));
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() =>
    localStorage.getItem("emowell_token")
  );

  const login = (accessToken, userData) => {
    setUser(userData);
    setToken(accessToken);
    localStorage.setItem("emowell_token", accessToken);
    localStorage.setItem("emowell_user", JSON.stringify(userData));
    window.location.href = "/";
  };

  // Also sync localStorage when profile is updated from Profile page
  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem("emowell_user", JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch {
      console.warn("Logout API failed, clearing session anyway");
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem("emowell_token");
    localStorage.removeItem("emowell_user");
    window.location.href = "/login";
  };

  // Called after account deletion — clears everything locally
  const clearSession = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("emowell_token");
    localStorage.removeItem("emowell_user");
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, clearSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}