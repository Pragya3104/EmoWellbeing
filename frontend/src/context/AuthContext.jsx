import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("emowell_user");
    const storedToken = localStorage.getItem("emowell_token");

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (userData, token) => {
    localStorage.setItem("emowell_user", JSON.stringify(userData));
    localStorage.removeItem("emowell_token");
    localStorage.setItem("emowell_token", token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("emowell_user");
    localStorage.removeItem("emowell_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
