import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import Search from "./pages/Search.jsx";
import Pricing from "./pages/Pricing.jsx";

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/pricing" element={<Pricing />} />
      </Routes>
    </div>
  );
}

