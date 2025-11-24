// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

// PENTING: load index.css dulu untuk variabel :root & default styles
import "./index.css";
// App-level styles setelah index.css
import "./App.css";

import App from "./App.jsx";

// Import AuthProvider dari lokasi yang benar
import { AuthProvider } from "./auth/AuthProvider.jsx"; 
// Catatan: Pastikan Anda mengimport dengan { AuthProvider } atau tanpa kurung kurawal,
// tergantung cara Anda meng-export-nya di AuthProvider.jsx

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      {/* KRITIS: Bungkus App di dalam AuthProvider */}
      <AuthProvider> 
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);