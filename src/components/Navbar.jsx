// src/components/Navbar.jsx
import React, { useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [credits, setCredits] = useState(null);
  const [sub, setSub] = useState({ status: "free", name: "Free" });
  const [loadingSub, setLoadingSub] = useState(true);

  useEffect(() => {
    let timer;
    let alive = true;

    async function load() {
      try {
        const r = await fetch("/api/me", { credentials: "include" });
        if (!r.ok) {
          if (alive) {
            setCredits(null);
            setSub({ status: "free", name: "Free" });
          }
          return;
        }
        const j = await r.json();
        if (!alive) return;
        setCredits(typeof j?.credits?.balance === "number" ? j.credits.balance : null);
        setSub(j?.subscription || { status: "free", name: "Free" });
      } catch {
        if (alive) {
          setCredits(null);
          setSub({ status: "free", name: "Free" });
        }
      } finally {
        if (alive) setLoadingSub(false);
      }
    }

    if (user) {
      load();
      timer = setInterval(load, 30000);
      const onFocus = () => load();
      window.addEventListener("focus", onFocus);
      return () => {
        alive = false;
        clearInterval(timer);
        window.removeEventListener("focus", onFocus);
      };
    } else {
      setCredits(null);
      setSub({ status: "free", name: "Free" });
      setLoadingSub(false);
    }
  }, [user]);

  const isUpgraded = !!user && (sub.status === "active" || sub.status === "trialing");

  return (
    <header className="navbar nav">
      <div className="nav-inner">
        <div className="nav-left">
          <Link to="/" className="nav-brand" aria-label="Playlist Supplier Home">
            <img
              className="brand-icon"
              src="https://i.imgur.com/W7aj72M.png"
              alt=""
              aria-hidden
              style={{ height: "32px", width: "32px" }}
            />
            <span className="brand-text">Playlist Searcher</span>
          </Link>

          <nav className="nav-menu" aria-label="Primary">
            <NavLink
              to="/"
              end
              className={({ isActive }) => "nav-link" + (isActive ? " is-active" : "")}
            >
              <img
                src="https://cdn-icons-png.flaticon.com/512/1946/1946488.png"
                alt=""
                aria-hidden
              />
              <span>Home</span>
            </NavLink>

            {!isUpgraded && (
              <NavLink
                to="/pricing"
                className={({ isActive }) => "nav-link" + (isActive ? " is-active" : "")}
              >
                <img
                  src="https://icons.iconarchive.com/icons/iconsmind/outline/512/Pricing-icon.png"
                  alt=""
                  aria-hidden
                />
                <span>Pricing</span>
              </NavLink>
            )}

            {user && (
              <NavLink
                to="/search"
                className={({ isActive }) => "nav-link" + (isActive ? " is-active" : "")}
              >
                <img
                  src="https://cdn-icons-png.flaticon.com/512/54/54481.png"
                  alt=""
                  aria-hidden
                />
                <span>Search</span>
              </NavLink>
            )}
          </nav>
        </div>

        <div className="nav-right">
          {user && (
            <span
              className={
                "nav-credits " +
                (credits === 0 ? "zero" : "") +
                (credits === null ? "loading" : "")
              }
              title="Credits"
            >
              {credits === null ? "…" : credits}
            </span>
          )}

          {user ? (
            <>
              <Link to="/profile" className="icon-btn" title="Profile" aria-label="Profile">
                <img src="https://cdn-icons-png.flaticon.com/512/1077/1077063.png" alt="" aria-hidden />
              </Link>
              <button className="icon-btn" onClick={logout} aria-label="Log out" title="Log out">
                <img src="https://cdn-icons-png.flaticon.com/512/56/56805.png" alt="" aria-hidden />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="icon-btn" aria-label="Log in" title="Log in">
                <img src="https://cdn-icons-png.flaticon.com/512/1828/1828490.png" alt="" aria-hidden />
              </Link>
              <Link to="/signup" className="icon-btn" aria-label="Sign up" title="Sign up">
                <img src="https://cdn-icons-png.flaticon.com/512/1828/1828817.png" alt="" aria-hidden />
              </Link>
            </>
          )}

          <button className="icon-btn" aria-label="Settings">
            <img src="https://cdn-icons-png.flaticon.com/512/126/126472.png" alt="" aria-hidden />
          </button>
        </div>
      </div>
    </header>
  );
}
