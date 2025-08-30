import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ padding: "2rem" }}>Načítám…</div>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}
