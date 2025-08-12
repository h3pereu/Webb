import React from 'react'
import { NavLink } from 'react-router-dom'

export default function Navbar(){
  return (
    <div className="navbar">
      <div className="nav-item">
        <NavLink to="/" end>
          <img src="/home.png" alt="Home Icon" />
          <span>Home</span>
        </NavLink>
      </div>
      <div className="nav-item">
        <NavLink to="/search">
          <img src="/search.png" alt="Search Icon" />
          <span>Search</span>
        </NavLink>
      </div>
      <div className="right">
        <a href="#" aria-label="Settings"><img src="/Settings.png" alt="Settings" /></a>
      </div>
    </div>
  )
}