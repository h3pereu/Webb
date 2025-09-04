// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const API = ""; // Vite proxy → call relatively: /api/...

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load session on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/me`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user ?? null);
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function fetchMeAndSet() {
    const r = await fetch(`${API}/api/me`, { credentials: "include" });
    if (!r.ok) return setUser(null);
    const j = await r.json();
    setUser(j.user ?? null);
    return j.user ?? null;
  }

  const value = useMemo(
    () => ({
      user,
      loading,

      // email/password login
      login: async (email, password) => {
        const res = await fetch(`${API}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          throw new Error(e.error || "Login failed");
        }
        return await fetchMeAndSet();
      },

      // email/password signup (with optional name)
      signup: async (email, password, name = "") => {
        const res = await fetch(`${API}/api/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password, name }),
        });
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          throw new Error(e.error || "Signup failed");
        }
        return await fetchMeAndSet();
      },

      // google signup/login (pass the credential from the GoogleLogin onSuccess)
      loginWithGoogle: async (credential) => {
        const res = await fetch(`${API}/api/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ credential }),
        });
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          throw new Error(e.error || "Google sign-in failed");
        }
        return await fetchMeAndSet();
      },

      logout: async () => {
        await fetch(`${API}/api/auth/logout`, { method: "POST", credentials: "include" });
        setUser(null);
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
