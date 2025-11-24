import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

/**
 * Komponen ProtectedRoute untuk melindungi rute yang memerlukan otentikasi.
 * Menunggu hingga status autentikasi selesai dimuat sebelum mengarahkan.
 */
export default function ProtectedRoute({ children }) {
  // Ambil token DAN status loading dari useAuth()
  const { token, loading } = useAuth(); 
  const location = useLocation();

  // 1. Tampilkan Indikator Loading sementara verifikasi status Auth berlangsung
  if (loading) {
    // Anda bisa mengganti ini dengan komponen spinner yang lebih bagus
    return (
        <div className="flex justify-center items-center h-screen text-xl text-gray-600">
            Checking session...
        </div>
    );
  }

  // 2. Jika Loading selesai DAN TIDAK ada token, redirect ke /login
  if (!token) {
    // Menyertakan `state.from` agar user kembali ke halaman yang diminta setelah login.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 3. Jika Loading selesai DAN ada token, tampilkan children (halaman yang diminta)
  return children;
}