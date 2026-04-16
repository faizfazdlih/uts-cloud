const express = require('express');
const pool = require('../db');

const router = express.Router();

router.get('/', async (_, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, area, pickup_date, start_time, end_time, notes, created_by, created_at
       FROM pickup_schedules
       ORDER BY pickup_date ASC, start_time ASC`
    );

    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { area, pickup_date, start_time, end_time, notes, created_by } = req.body;

    if (!area || !pickup_date || !start_time || !end_time) {
      return res.status(400).json({
        message: 'Data tidak lengkap. area, pickup_date, start_time, end_time wajib diisi.',
      });
    }

    const [result] = await pool.query(
      `INSERT INTO pickup_schedules (area, pickup_date, start_time, end_time, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [area, pickup_date, start_time, end_time, notes || null, created_by || 'admin']
    );

    const [rows] = await pool.query('SELECT * FROM pickup_schedules WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { area, pickup_date, start_time, end_time, notes } = req.body;

    if (!area || !pickup_date || !start_time || !end_time) {
      return res.status(400).json({
        message: 'Data tidak lengkap. area, pickup_date, start_time, end_time wajib diisi.',
      });
    }

    const [result] = await pool.query(
      `UPDATE pickup_schedules
       SET area = ?, pickup_date = ?, start_time = ?, end_time = ?, notes = ?
       WHERE id = ?`,
      [area, pickup_date, start_time, end_time, notes || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Jadwal tidak ditemukan.' });
    }

    const [rows] = await pool.query('SELECT * FROM pickup_schedules WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
