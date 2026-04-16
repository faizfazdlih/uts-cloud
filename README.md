# Sistem Manajemen Persampahan (React + Express + MySQL)

Aplikasi web untuk masyarakat dan admin pemerintah dengan fitur:
1. Pelaporan sampah liar (dengan lokasi)
2. Jadwal pengangkutan sampah
3. Monitoring petugas kebersihan

Pada fitur pelaporan, lokasi bisa dipilih langsung dari peta (OpenStreetMap) dan user dapat mengupload gambar sampah.

## Struktur Proyek

- `frontend/` → React (Vite)
- `backend/` → Express.js
- `backend/schema.sql` → skema database MySQL

## Menjalankan Backend

1. Masuk ke folder backend
2. Install dependency: `npm install`
3. Salin `.env.example` menjadi `.env`, lalu sesuaikan konfigurasi MySQL
4. Jalankan SQL pada file `schema.sql`
5. Start server: `npm run dev`

Backend default berjalan di: `http://localhost:4000`

## Menjalankan Frontend

1. Masuk ke folder frontend
2. Install dependency: `npm install`
3. Salin `.env.example` menjadi `.env`
4. Jalankan: `npm run dev`

Frontend default berjalan di: `http://localhost:5173`

## Endpoint Utama API

- `GET /api/reports`
- `POST /api/reports`
- `PUT /api/reports/:id/status`
- `GET /api/schedules`
- `POST /api/schedules`
- `PUT /api/schedules/:id`
- `GET /api/officers`
- `POST /api/officers`
- `POST /api/officers/:id/logs`
- `GET /api/monitoring`
