import axios from "axios";

// Ambil BASE_URL dari environment variable (set di docker-compose.yml atau .env lokal)
const VITE_API_URL = import.meta.env.VITE_API_URL;

let effectiveBaseURL;

if (VITE_API_URL) {
    // Jika VITE_API_URL disetel, gunakan itu. 
    // Di Docker Compose dengan Nginx, ini *seharusnya* "/api" atau path relatif.
    effectiveBaseURL = VITE_API_URL;
} else if (import.meta.env.DEV) {
    // Mode development lokal (vite dev), gunakan localhost:3001
    effectiveBaseURL = "http://localhost:3001";
} else {
    // Default fallback untuk build production tanpa VITE_API_URL yang disetel
    // Menggunakan path relatif yang akan diurus oleh Nginx di Docker
    effectiveBaseURL = "/api"; 
}


console.log(`Axios Base URL set to: ${effectiveBaseURL}`); // Debugging

const api = axios.create({
  baseURL: effectiveBaseURL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // Kritis untuk mengirim cookie/session
});

api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // Abaikan error local storage
  }
  return config;
});

export default api;