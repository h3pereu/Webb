import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const API = ""; // díky Vite proxy voláme relativně: /api/...

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // načti session při startu
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/me`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    login: async (email, password) => {
      const res = await fetch(`${API}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const e = await res.json().catch(()=>({error:"Login failed"}));
        throw new Error(e.error || "Login failed");
      }
      const data = await res.json();
      setUser(data.user);
      return data.user;
    },
    signup: async (email, password) => {
      const res = await fetch(`${API}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const e = await res.json().catch(()=>({error:"Signup failed"}));
        throw new Error(e.error || "Signup failed");
      }
      const data = await res.json();
      setUser(data.user);
      return data.user;
    },
    logout: async () => {
      await fetch(`${API}/api/logout`, { method: "POST", credentials: "include" });
      setUser(null);
    }
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
