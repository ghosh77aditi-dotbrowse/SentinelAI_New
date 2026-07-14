import { createContext, useContext, useState, useCallback } from 'react';
import axiosClient from "../api/axiosClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem("sentinelai_user");
    return cached ? JSON.parse(cached) : null;
  });

  const login = useCallback(async (email, password) => {
    const response = await axiosClient.post("/auth/login", {
      useremail: email,
      userpassword: password,
    });

    const data = response.data;

    localStorage.setItem("sentinelai_user", JSON.stringify(data.user));
    localStorage.setItem("sentinelai_token", data.token);

    setUser(data.user);

    return data.user;
  }, []);

  const registerCompany = useCallback(async (payload) => {
    const response = await axiosClient.post("/auth/register", {
      companyname: payload.companyName,
      companyemail: payload.companyEmail,
      username: payload.fullName,
      useremail: payload.email,
      userpassword: payload.password,
    });

    const data = response.data;

    localStorage.setItem("sentinelai_user", JSON.stringify(data.user));
    localStorage.setItem("sentinelai_token", data.token);

    setUser(data.user);

    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("sentinelai_user");
    localStorage.removeItem("sentinelai_token");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, registerCompany }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return ctx;
}