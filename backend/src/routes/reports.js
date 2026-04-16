const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const pool = require('../db');

const router = express.Router();
const uploadDir = path.join(__dirname, '../../uploads');

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    const safeExtension = extension || '.jpg';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExtension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(new Error('File harus berupa gambar.'));
    }
    cb(null, true);
  },
});

router.get('/', async (_, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, reporter_name, description, latitude, longitude, address, photo_url, status, created_at
       FROM waste_reports
       ORDER BY created_at DESC`
    );

    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.post('/', upload.single('photo'), async (req, res, next) => {
  try {
    const { reporter_name, description, latitude, longitude, address, photo_url } = req.body;
    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);
    const uploadedPhotoUrl = req.file ? `/uploads/${req.file.filename}` : photo_url;

    if (!reporter_name || !description || !Number.isFinite(parsedLatitude) || !Number.isFinite(parsedLongitude)) {
      return res.status(400).json({
        message: 'Data tidak lengkap. reporter_name, description, latitude, longitude wajib diisi.',
      });
    }

    const [result] = await pool.query(
      `INSERT INTO waste_reports (reporter_name, description, latitude, longitude, address, photo_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [reporter_name, description, parsedLatitude, parsedLongitude, address || null, uploadedPhotoUrl || null]
    );

    const [createdRows] = await pool.query('SELECT * FROM waste_reports WHERE id = ?', [result.insertId]);

    res.status(201).json(createdRows[0]);
  } catch (error) {
    next(error);
  }
});

router.put('/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['baru', 'diproses', 'selesai'].includes(status)) {
      return res.status(400).json({ message: 'Status harus: baru, diproses, atau selesai.' });
    }

    const [result] = await pool.query('UPDATE waste_reports SET status = ? WHERE id = ?', [status, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan.' });
    }

    const [rows] = await pool.query('SELECT * FROM waste_reports WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
