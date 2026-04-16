const express = require('express');
const pool = require('../db');

const router = express.Router();

router.get('/', async (_, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, phone, zone, is_active, created_at
       FROM officers
       ORDER BY created_at DESC`
    );

    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, phone, zone, is_active } = req.body;

    if (!name || !zone) {
      return res.status(400).json({ message: 'Data tidak lengkap. name dan zone wajib diisi.' });
    }

    const [result] = await pool.query(
      `INSERT INTO officers (name, phone, zone, is_active)
       VALUES (?, ?, ?, ?)`,
      [name, phone || null, zone, is_active ?? true]
    );

    const [rows] = await pool.query('SELECT * FROM officers WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/logs', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, status, notes } = req.body;

    if (latitude === undefined || longitude === undefined || !status) {
      return res.status(400).json({
        message: 'Data tidak lengkap. latitude, longitude, dan status wajib diisi.',
      });
    }

    const [officerRows] = await pool.query('SELECT id FROM officers WHERE id = ?', [id]);
    if (officerRows.length === 0) {
      return res.status(404).json({ message: 'Petugas tidak ditemukan.' });
    }

    const [result] = await pool.query(
      `INSERT INTO officer_logs (officer_id, latitude, longitude, status, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [id, latitude, longitude, status, notes || null]
    );

    const [rows] = await pool.query('SELECT * FROM officer_logs WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
