CREATE DATABASE IF NOT EXISTS sistem_persampahan;
USE sistem_persampahan;

CREATE TABLE IF NOT EXISTS waste_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reporter_name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  address VARCHAR(255),
  photo_url VARCHAR(255),
  status ENUM('baru', 'diproses', 'selesai') NOT NULL DEFAULT 'baru',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pickup_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  area VARCHAR(100) NOT NULL,
  pickup_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  notes TEXT,
  created_by VARCHAR(100) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS officers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(30),
  zone VARCHAR(100) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS officer_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  officer_id INT NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  status VARCHAR(100) NOT NULL,
  notes TEXT,
  logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_officer_logs_officer
    FOREIGN KEY (officer_id)
    REFERENCES officers(id)
    ON DELETE CASCADE
);
