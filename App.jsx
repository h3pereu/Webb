import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";


import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import Pricing from "./pages/Pricing.jsx";
import Search from "./pages/Search.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Profile from "./pages/Profile.jsx";


import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ProtectedSearchRoute from "./components/ProtectedSearchRoute.jsx";


// Gate the home route: signed-in users are sent to Search; guests see Hero (Home)
function HomeGate() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: "2rem" }}>Načítám…</div>;
  if (user) return <Navigate to="/search" replace />;
  return <Home />;
}


export default function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Routes>
        {/* Home -> Hero for guests, Search for signed-in users */}
        <Route path="/" element={<HomeGate />} />


        {/* veřejné */}
        <Route path="/pricing" element={<Pricing />} />


        {/* auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />


        {/* profil (jen přihlášený) */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />


        {/* search (přihlášený + musí mít kredit) */}
        <Route
          path="/search"
          element={
            <ProtectedSearchRoute>
              <Search />
            </ProtectedSearchRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}