import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedSearchRoute({ children }) {
  const { user, loading } = useAuth();
  const [credits, setCredits] = React.useState(null);
  const [checking, setChecking] = React.useState(true);
  const loc = useLocation();

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!user) return;
        const r = await fetch("/api/credits", { credentials: "include" });
        if (alive) {
          if (r.ok) {
            const d = await r.json();
            setCredits(d.credits);
          } else {
            setCredits(null);
          }
        }
      } catch {
        if (alive) setCredits(null);
      } finally {
        if (alive) setChecking(false);
      }
    })();
    return () => { alive = false; };
  }, [user]);

  if (loading || checking) return <div style={{ padding: "2rem" }}>Načítám…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (typeof credits === "number" && credits <= 0) {
    const redirect = encodeURIComponent(loc.pathname + loc.search);
    return <Navigate to={`/pricing?need=credits&redirect=${redirect}`} replace />;
  }

  return children;
}
