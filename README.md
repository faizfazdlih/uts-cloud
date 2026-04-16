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

### Setup S3 (Opsional)

Jika ingin upload gambar laporan langsung ke S3:

1. Isi konfigurasi S3 di `backend/.env`:
	- `S3_ENABLED=true`
	- `AWS_REGION`
	- `AWS_S3_BUCKET`
	- `AWS_ACCESS_KEY_ID`
	- `AWS_SECRET_ACCESS_KEY`
	- `AWS_S3_ACL=public-read` (opsional, jika ACL bucket mengizinkan)
	- `AWS_S3_PUBLIC_BASE_URL` (opsional, domain publik bucket/CDN)
2. Jalankan validasi koneksi: `npm run setup:s3`
3. Jalankan backend seperti biasa: `npm run dev`

Jika `S3_ENABLED=false`, gambar tetap disimpan lokal di folder `backend/uploads`.

Catatan: agar gambar dapat diakses langsung dari URL bucket S3, bucket/object harus memiliki akses publik (via ACL atau bucket policy).

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
