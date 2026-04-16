const express = require('express');
const pool = require('../db');

const router = express.Router();

router.get('/', async (_, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT o.id,
              o.name,
              o.zone,
              o.phone,
              o.is_active,
              ol.latitude,
              ol.longitude,
              ol.status AS latest_status,
              ol.notes AS latest_notes,
              ol.logged_at AS last_update
       FROM officers o
       LEFT JOIN officer_logs ol
         ON ol.id = (
              SELECT ol2.id
              FROM officer_logs ol2
              WHERE ol2.officer_id = o.id
              ORDER BY ol2.logged_at DESC
              LIMIT 1
            )
       ORDER BY o.name ASC`
    );

    res.json(rows);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
