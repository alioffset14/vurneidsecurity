import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import api from "../api/axios"; // Pastikan path ini benar
import { useNavigate } from "react-router-dom"; 

// 1. Inisialisasi Context
const AuthContext = createContext(null);

// 2. Hook Kustom untuk Mengakses Context
// Hook ini harus diexport sebagai NAMED export
export function useAuth() {
  return useContext(AuthContext);
}

// 3. Komponen Provider
// Component harus diexport sebagai DEFAULT export (lebih umum untuk Provider)
export default function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  // Menggunakan 'token' sebagai key standar, sesuai dengan convention
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true); // Mulai dengan true untuk menunggu verifikasi token
  
  const navigate = useNavigate();

  // Efek 1: Sinkronisasi Token ke Axios Header & localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      // Set header Authorization untuk semua request yang menggunakan 'api' instance
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`; 
    } else {
      localStorage.removeItem("token");
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Efek 2: Verifikasi Token saat aplikasi dimuat
  useEffect(() => {
    async function verifyToken() {
        if (token) {
            try {
                // Endpoint untuk memverifikasi token dan mengambil data user
                const response = await api.get("/auth/me"); 
                setCurrentUser(response.data.user || response.data);
            } catch (error) {
                // Token tidak valid atau expired
                console.error("Token verification failed, signing out:", error);
                setToken(null);
                setCurrentUser(null);
            }
        }
        setLoading(false); // Selesai loading
    }
    verifyToken();
  }, []); // Hanya berjalan saat mount

  // --- Fungsi Otentikasi ---

  const handleAuthSuccess = (newToken, userData) => {
    setToken(newToken); // Efek 1 akan menyimpan ini ke localStorage & Axios header
    setCurrentUser(userData);
    navigate("/");
  };

  const signIn = async ({ email, password }) => {
    setLoading(true);
    try {
      // Menggunakan /auth/signin atau /auth/login sesuai backend Anda
      const res = await api.post("/auth/login", { email, password });
      const data = res.data || {};

      const newToken = data.token || data.accessToken || null;
      const userData = data.user || (data?.data && data.data.user) || null;

      if (newToken && userData) {
        handleAuthSuccess(newToken, userData);
        return { ok: true, message: "Sign in success" };
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Login failed";
      return { ok: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async ({ name, email, password }) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/signup", { name, email, password });
      const data = res.data || {};
      
      const newToken = data.token || data.accessToken || null;
      const userData = data.user || (data?.data && data.data.user) || null;

      // Asumsi: Jika signup berhasil, user langsung login (mendapatkan token)
      if (newToken && userData) {
        handleAuthSuccess(newToken, userData);
        return { ok: true, tokenProvided: true };
      } else {
        // Jika signup berhasil tapi tidak ada token/user di response
        return { ok: true, tokenProvided: false };
      }

    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Signup failed";
      return { ok: false, message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    setToken(null); // Ini akan memicu Efek 1 untuk menghapus token
    setCurrentUser(null);
    navigate("/login");
  };
  
  // Fungsi untuk update data user dari Profile/Settings, dll.
  const updateCurrentUser = (updatedUserData) => {
    setCurrentUser(prevUser => ({
      ...prevUser,
      ...updatedUserData,
    }));
  };


  // Gunakan useMemo untuk memastikan nilai context stabil
  const value = useMemo(() => ({
    currentUser,
    token,
    loading,
    signIn,
    signOut,
    signUp,
    updateCurrentUser, // Memberikan akses ke fungsi update
  }), [currentUser, token, loading]);

  // Tampilkan loading screen sampai verifikasi token selesai
  if (loading) {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '20px', color: '#3498db', fontWeight: 'bold' }}>
          Loading Authentication...
        </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}