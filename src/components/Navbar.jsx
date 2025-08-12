import React from "react";
import { NavLink, Link } from "react-router-dom";

export default function Navbar() {
  const linkClass = ({ isActive }) => "nav-link" + (isActive ? " is-active" : "");

  return (
    // keep "navbar" class so the rest of your layout can still query its height
    <header className="navbar nav">
      <div className="nav-inner">
        {/* Brand */}
        <Link to="/" className="nav-brand" aria-label="PlaylistSupplier Home">
          <img className="brand-icon" src="/home.png" alt="" aria-hidden="true" />
          <span className="brand-text">PlaylistSupplier</span>
        </Link>

        {/* Primary menu */}
        <nav className="nav-menu" aria-label="Primary">
          <NavLink to="/" end className={linkClass} title="Home">
            <img src="https://cdn-icons-png.flaticon.com/512/1946/1946488.png" alt="" aria-hidden="true" />
            <span>Home</span>
          </NavLink>

          <NavLink to="/search" className={linkClass} title="Search">
            <img src="https://cdn-icons-png.flaticon.com/512/54/54481.png" alt="" aria-hidden="true" />
            <span>Search</span>
          </NavLink>
        </nav>

        {/* Right action(s) */}
        <div className="nav-right">
          <button className="icon-btn" aria-label="Settings">
            <img src="https://cdn-icons-png.flaticon.com/512/126/126472.png" alt="" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}