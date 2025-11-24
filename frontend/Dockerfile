# /frontend/Dockerfile

# =========================================================
# STAGE 1: BUILD APLIKASI
# Menginstal dependensi dan membuat bundle frontend (mis. dist/)
# =========================================================
FROM node:18-alpine AS builder

WORKDIR /app

# Langkah 1: Copy file package.json (agar perubahan pada kode tidak
# memicu instalasi ulang dependensi jika package.json tidak berubah)
COPY package*.json ./
RUN npm ci

# Langkah 2: Copy semua source code lainnya dan jalankan build
COPY . .
RUN npm run build

# =========================================================
# STAGE 2: PRODUCTION/RUNTIME
# Menggunakan Nginx minimal untuk menyajikan file statis
# =========================================================
FROM nginx:stable-alpine AS final

# Hapus file default Nginx
RUN rm -rf /usr/share/nginx/html/*

# Salin output build dari Stage 1 ke direktori serve Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Salin konfigurasi Nginx kustom Anda
# Pastikan file nginx.conf berada di direktori frontend atau root sesuai konteks build
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Ekspos port default Nginx
EXPOSE 80

# Jalankan Nginx
CMD ["nginx", "-g", "daemon off;"]