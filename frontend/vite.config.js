import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => {
  // proxy hanya di dev (vite dev server)
  const devServer = command === "serve" ? {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      // proxies untuk API dan static uploads ke service 'backend' di docker-compose (dev)
      "/api": {
        target: "http://backend:3001",
        changeOrigin: true,
        secure: false
      },
      "/uploads": {
        target: "http://backend:3001",
        changeOrigin: true,
        secure: false
      }
    }
  } : undefined;

  return {
    plugins: [react()],
    server: devServer
  };
});
