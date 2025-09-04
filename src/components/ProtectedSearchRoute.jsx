// src/components/ProtectedSearchRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedSearchRoute({ children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading) return <div style={{ padding: "2rem" }}>Loading…</div>;

  // Only require login; do NOT check credits here
  if (!user) {
    const redirect = encodeURIComponent(loc.pathname + loc.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return children;
}
