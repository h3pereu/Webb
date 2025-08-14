// src/components/Navbar.jsx
import React from "react";
import { NavLink, Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="navbar nav">{/* <-- BOTH classes: navbar + nav */}
      <div className="nav-inner">
        <Link to="/" className="nav-brand" aria-label="Playlist Supplier Home">
          <img className="brand-icon" src="/home.png" alt="" aria-hidden />
          <span className="brand-text">-----------</span>
        </Link>

        <nav className="nav-menu" aria-label="Primary">
          <NavLink to="/" end className={({isActive}) => "nav-link" + (isActive ? " is-active" : "")}>
            <img src="https://cdn-icons-png.flaticon.com/512/1946/1946488.png" alt="" aria-hidden />
            <span>Home</span>
          </NavLink>
          <NavLink to="/search" className={({isActive}) => "nav-link" + (isActive ? " is-active" : "")}>
            <img src="https://cdn-icons-png.flaticon.com/512/54/54481.png" alt="" aria-hidden />
            <span>Search</span>
          </NavLink>
        </nav>

        <div className="nav-right">
          <button className="icon-btn" aria-label="Settings">
            <img src="https://cdn-icons-png.flaticon.com/512/126/126472.png" alt="" aria-hidden />
          </button>
        </div>
      </div>
    </header>
  );
}
