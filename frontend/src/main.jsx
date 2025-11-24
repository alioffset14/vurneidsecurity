import React from "react";
import ReactDOM from "react-dom/client";
// 1. Import BrowserRouter untuk menyediakan routing context
import { BrowserRouter } from "react-router-dom"; 

import "./index.css";
import "./App.css";

import App from "./App.jsx";

// 2. Import AuthProvider (Path dikoreksi: dari ".auth" menjadi "./auth")
import AuthProvider from "./auth/AuthProvider.jsx";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    {/* Urutan: Router membungkus AuthProvider, AuthProvider membungkus App */}
    <BrowserRouter> 
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);