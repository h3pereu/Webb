import React, { useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [credits, setCredits] = useState(null);

  useEffect(() => {
    let timer;
    async function load() {
      try {
        const r = await fetch("/api/credits", { credentials: "include" });
        if (r.ok) {
          const { credits } = await r.json();
          setCredits(credits);
        } else {
          setCredits(null);
        }
      } catch { setCredits(null); }
    }
    if (user) {
      load();
      timer = setInterval(load, 30000);
      const onFocus = () => load();
      window.addEventListener("focus", onFocus);
      return () => { clearInterval(timer); window.removeEventListener("focus", onFocus); };
    } else {
      setCredits(null);
    }
  }, [user]);

  return (
    <header className="navbar nav">
      <div className="nav-inner">
        <div className="nav-left">
          <Link to="/" className="nav-brand" aria-label="Playlist Supplier Home">
            <img className="brand-icon" src="/home.png" alt="" aria-hidden />
            <span className="brand-text">-----------</span>
          </Link>

          <nav className="nav-menu" aria-label="Primary">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                "nav-link" + (isActive ? " is-active" : "")
              }
            >
              <img
                src="https://cdn-icons-png.flaticon.com/512/1946/1946488.png"
                alt=""
                aria-hidden
              />
              <span>Home</span>
            </NavLink>

            <NavLink
              to="/pricing"
              className={({ isActive }) =>
                "nav-link" + (isActive ? " is-active" : "")
              }
            >
              <img
                src="https://icons.iconarchive.com/icons/iconsmind/outline/512/Pricing-icon.png"
                alt=""
                aria-hidden
              />
              <span>Pricing</span>
            </NavLink>

            <NavLink
              to="/search"
              className={({ isActive }) =>
                "nav-link" + (isActive ? " is-active" : "")
              }
            >
              <img
                src="https://cdn-icons-png.flaticon.com/512/54/54481.png"
                alt=""
                aria-hidden
              />
              <span>Search</span>
            </NavLink>
          </nav>
        </div>

        <div className="nav-right">
          {typeof credits === "number" && (
            <span
              title="Credits"
              style={{
                fontSize: 13,
                padding: "6px 10px",
                border: "1px solid var(--psl-border,#e7eaf0)",
                borderRadius: 12,
                marginRight: 8,
                background: "#fff"
              }}
            >
              ⚡ {credits}
            </span>
          )}

          {user ? (
            <>
              <Link to="/profile" className="icon-btn" title="Profil" aria-label="Profil">
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
