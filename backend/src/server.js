const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

const reportRoutes = require('./routes/reports');
const scheduleRoutes = require('./routes/schedules');
const officerRoutes = require('./routes/officers');
const monitoringRoutes = require('./routes/monitoring');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (_, res) => {
  res.json({
    message: 'Backend Sistem Manajemen Persampahan aktif',
    docs: {
      health: '/api/health',
      reports: '/api/reports',
      schedules: '/api/schedules',
      officers: '/api/officers',
      monitoring: '/api/monitoring',
    },
  });
});

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', message: 'API Sistem Manajemen Persampahan aktif' });
});

app.use('/api/reports', reportRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/officers', officerRoutes);
app.use('/api/monitoring', monitoringRoutes);

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({
    message: 'Terjadi kesalahan di server',
    error: err.message,
  });
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
