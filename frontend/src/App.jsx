// src/App.jsx
import { useEffect, useState, useRef } from "react";
// Import dari react-router-dom hanya untuk fungsionalitas yang dipakai di AppInner
import { Routes, Route, Link } from "react-router-dom"; 

// Halaman & Komponen
import Home from "./pages/Home";
import Targets from "./pages/Targets";
import Tests from "./pages/Tests";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// Authentication & Network
import { useAuth } from "./auth/AuthProvider"; // Hanya perlu hook, bukan Provider-nya
import ProtectedRoute from "./components/ProtectedRoute";
import api from "./api/axios"; // HANYA import instance API secara default

import "./App.css";

function App() {
  // Menggunakan useAuth dari context yang disediakan oleh main.jsx
  const { currentUser, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      // Logika penutupan menu dropdown
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  return (
    <>
      <nav className="navbar">
        <div className="nav-left">
          <Link to="/" className="brand-link">
            <h2 className="brand-title">🔒 VurneID Security Scanner</h2>
          </Link>

          <div className="nav-links">
            <Link to="/" className="nav-link">Dashboard</Link>
            <Link to="/targets" className="nav-link">Targets</Link>
            <Link to="/tests" className="nav-link">Tests</Link>
            <Link to="/reports" className="nav-link">Reports</Link>
          </div>
        </div>

        <div className="nav-right" ref={menuRef}>
            {currentUser ? (
                <>
                  <div className="user-info" onClick={() => setMenuOpen((s) => !s)}>
                    <span className="user-name">{currentUser?.name || currentUser?.email || "User"}</span>
                    <span className="caret">▾</span>
                  </div>

                  {menuOpen && (
                    <div className="user-menu">
                      <Link to="/profile" className="user-menu-item" onClick={() => setMenuOpen(false)}>
                        Profile
                      </Link>
                      <button
                        type="button"
                        className="user-menu-item"
                        onClick={() => {
                          setMenuOpen(false);
                          signOut();
                        }}
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </>
            ) : (
                <Link to="/login" className="nav-link auth-link">Login</Link>
            )}
        </div>
      </nav>

      <main className="main-content">
        <div className="container">
          <Routes>
            {/* public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* protected routes */}
            {/* Menggunakan elemen <ProtectedRoute> untuk membungkus halaman yang membutuhkan otentikasi */}
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/targets" element={<ProtectedRoute><Targets /></ProtectedRoute>} />
            <Route path="/tests" element={<ProtectedRoute><Tests /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          </Routes>
        </div>
      </main>
    </>
  );
}

// Komponen App di-export secara default
export default App;