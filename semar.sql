-- ============================================================================
-- DATABASE APLIKASI PENGELOLAAN SAMPAH ORGANIK & BIOKONVERSI MAGGOT
-- Kompatibel dengan: MySQL 8.0+ / MariaDB 10.5+
-- Mencakup 5 Modul Utama:
--   1. Tong   (Status Tong Pintar & Telemetri IoT)
--   2. Catat  (Setoran, Penimbangan & Pemilahan Sampah)
--   3. Olah   (Drum Komposter, Lemari Maggot, Oven Surya & Panen)
--   4. Kas    (Pemasukan, Pengeluaran & Aturan Paguyuban)
--   5. Dampak (Agregasi Organik Teralihkan, Emisi CO2e & Peringkat Lantai)
-- ============================================================================

CREATE DATABASE IF NOT EXISTS db_sampah_pintar
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE db_sampah_pintar;

-- ============================================================================
-- BAGIAN 1: DATA DEFINITION LANGUAGE (DDL - PEMBUATAN TABEL)
-- ============================================================================

-- 1. Master Blok & Parameter Baseline Lingkungan
CREATE TABLE blocks (
  block_id INT AUTO_INCREMENT PRIMARY KEY,
  block_name VARCHAR(100) NOT NULL COMMENT 'Nama blok hunian',
  baseline_organic_kg_week DECIMAL(6,2) NOT NULL DEFAULT 108.00 COMMENT 'Garis acuan timbulan awal 14 hari (kg/minggu)',
  ipcc_emission_factor DECIMAL(6,4) NOT NULL DEFAULT 0.5357 COMMENT 'Faktor emisi IPCC disesuaikan metana TPA Benowo (kg CO2e/kg)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Master Operator Lapangan
CREATE TABLE operators (
  operator_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL COMMENT 'Nama petugas/operator (contoh: Rina)',
  phone VARCHAR(20) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Master Tong Pintar per Lantai
CREATE TABLE smart_bins (
  bin_id INT AUTO_INCREMENT PRIMARY KEY,
  block_id INT NOT NULL,
  floor_number INT NOT NULL COMMENT 'Urutan lantai (1 s.d. 5)',
  floor_label VARCHAR(50) NOT NULL COMMENT 'Label tampilan (Lantai 1 - Lantai 5)',
  max_capacity_kg DECIMAL(5,2) NOT NULL DEFAULT 11.50 COMMENT 'Kapasitas maksimal tong dalam kg',
  is_sensor_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'FALSE jika status Sensor off (Lantai 5)',
  fixed_schedule_note VARCHAR(100) NULL COMMENT 'Catatan jadwal manual jika sensor nonaktif',
  CONSTRAINT fk_bins_block FOREIGN KEY (block_id) REFERENCES blocks(block_id) ON DELETE CASCADE,
  UNIQUE KEY uq_block_floor (block_id, floor_number)
) ENGINE=InnoDB;

-- 4. Log Pembacaan Sensor Tong Pintar (Halaman: Tong & tombol Ambil dari sensor)
CREATE TABLE bin_telemetry_logs (
  telemetry_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  bin_id INT NOT NULL,
  weight_kg DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT 'Berat terukur sensor (kg)',
  fill_percent INT NOT NULL DEFAULT 0 COMMENT 'Persentase kapasitas terisi (%)',
  waste_age_hours INT NOT NULL DEFAULT 0 COMMENT 'Umur sampah sejak pengosongan terakhir (jam)',
  temperature_c DECIMAL(4,1) NULL COMMENT 'Suhu dalam tong (Celcius)',
  status_badge ENUM('Aman', 'Segera', 'Jemput', 'Sensor off') NOT NULL DEFAULT 'Aman',
  recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_telemetry_bin FOREIGN KEY (bin_id) REFERENCES smart_bins(bin_id) ON DELETE CASCADE,
  INDEX idx_bin_recorded (bin_id, recorded_at DESC)
) ENGINE=InnoDB;

-- 5. Transaksi Setoran & Pemilahan Sampah (Halaman: Catat)
CREATE TABLE waste_collections (
  collection_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  bin_id INT NOT NULL,
  operator_id INT NOT NULL,
  collection_date DATE NOT NULL COMMENT 'Tanggal penjemputan & pemilahan',
  total_weight_kg DECIMAL(6,2) NOT NULL COMMENT 'Total berat masuk (kg)',
  maggot_feed_kg DECIMAL(6,2) NOT NULL DEFAULT 0.00 COMMENT 'Sisa makanan -> maggot (kg)',
  composter_kg DECIMAL(6,2) NOT NULL DEFAULT 0.00 COMMENT 'Bahan keras -> komposter (kg)',
  anorganik_kg DECIMAL(6,2) NOT NULL DEFAULT 0.00 COMMENT 'Plastik terselip -> anorganik (kg)',
  corridor_odor ENUM('Tidak', 'Sedikit tercium', 'Ya, menyengat') NOT NULL DEFAULT 'Tidak',
  photo_url VARCHAR(255) NULL COMMENT 'Lokasi file foto bukti (opsional)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_collections_bin FOREIGN KEY (bin_id) REFERENCES smart_bins(bin_id),
  CONSTRAINT fk_collections_operator FOREIGN KEY (operator_id) REFERENCES operators(operator_id),
  INDEX idx_collection_date (collection_date)
) ENGINE=InnoDB;

-- 6. Master Drum Komposter (Halaman: Olah)
CREATE TABLE composter_drums (
  drum_id INT AUTO_INCREMENT PRIMARY KEY,
  block_id INT NOT NULL,
  drum_name VARCHAR(50) NOT NULL COMMENT 'Contoh: Drum komposter 1, Drum komposter 2',
  batch_start_date DATE NOT NULL COMMENT 'Tanggal mulai batch untuk menghitung Hari ke-N',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT fk_drums_block FOREIGN KEY (block_id) REFERENCES blocks(block_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Log Harian Drum Komposter (Suhu & Putaran Harian)
CREATE TABLE composter_daily_logs (
  drum_log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  drum_id INT NOT NULL,
  log_date DATE NOT NULL,
  temperature_c DECIMAL(4,1) NOT NULL COMMENT 'Suhu inti kompos (Celcius)',
  turns_done INT NOT NULL DEFAULT 0 COMMENT 'Jumlah putaran selesai hari ini',
  turns_target INT NOT NULL DEFAULT 2 COMMENT 'Target putaran per hari (default 2)',
  CONSTRAINT fk_drum_logs_drum FOREIGN KEY (drum_id) REFERENCES composter_drums(drum_id) ON DELETE CASCADE,
  UNIQUE KEY uq_drum_date (drum_id, log_date)
) ENGINE=InnoDB;

-- 8. Log Harian Lemari Maggot & Oven Surya (Halaman: Olah)
CREATE TABLE maggot_oven_logs (
  log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  block_id INT NOT NULL,
  log_date DATE NOT NULL,
  feed_in_kg DECIMAL(6,2) NOT NULL DEFAULT 0.00 COMMENT 'Pakan hari ini (kg)',
  prepupa_out_kg DECIMAL(6,2) NOT NULL DEFAULT 0.00 COMMENT 'Panen prepupa otomatis (kg)',
  has_mating_eggs BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Status kandang kawin (TRUE = telur tersedia)',
  oven_fresh_in_kg DECIMAL(6,2) NOT NULL DEFAULT 0.00 COMMENT 'Maggot segar masuk oven surya (kg)',
  oven_dried_out_kg DECIMAL(6,2) NOT NULL DEFAULT 0.00 COMMENT 'Maggot kering keluar oven surya (kg)',
  CONSTRAINT fk_maggot_oven_block FOREIGN KEY (block_id) REFERENCES blocks(block_id) ON DELETE CASCADE,
  UNIQUE KEY uq_block_maggot_date (block_id, log_date)
) ENGINE=InnoDB;

-- 9. Catatan Hasil Panen Siap Jual (Tombol: + Catat panen / kasgot / kompos)
CREATE TABLE harvest_logs (
  harvest_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  block_id INT NOT NULL,
  operator_id INT NOT NULL,
  harvest_type ENUM('maggot_segar', 'maggot_kering', 'kasgot', 'kompos') NOT NULL,
  weight_kg DECIMAL(6,2) NOT NULL,
  notes TEXT NULL,
  harvest_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_harvest_block FOREIGN KEY (block_id) REFERENCES blocks(block_id),
  CONSTRAINT fk_harvest_operator FOREIGN KEY (operator_id) REFERENCES operators(operator_id)
) ENGINE=InnoDB;

-- 10. Transaksi Kas & Penjualan (Halaman: Kas)
CREATE TABLE cash_transactions (
  tx_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  block_id INT NOT NULL,
  operator_id INT NOT NULL,
  tx_date DATE NOT NULL,
  tx_type ENUM('INCOME', 'EXPENSE') NOT NULL COMMENT 'INCOME = Pemasukan, EXPENSE = Pengeluaran',
  category VARCHAR(50) NOT NULL COMMENT 'maggot_segar, maggot_kering, kasgot_kompos, anorganik, sayur, upah_operator, perawatan',
  description VARCHAR(150) NOT NULL COMMENT 'Contoh: Maggot segar 6 kg (lele)',
  amount_idr DECIMAL(12,2) NOT NULL COMMENT 'Nominal dalam Rupiah',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cash_block FOREIGN KEY (block_id) REFERENCES blocks(block_id),
  CONSTRAINT fk_cash_operator FOREIGN KEY (operator_id) REFERENCES operators(operator_id),
  INDEX idx_tx_date (tx_date)
) ENGINE=InnoDB;

-- 11. Aturan Pembagian Kas Paguyuban (Halaman: Kas)
CREATE TABLE paguyuban_rules (
  rule_id INT AUTO_INCREMENT PRIMARY KEY,
  block_id INT NOT NULL,
  priority_order INT NOT NULL COMMENT 'Urutan prioritas (1, 2, 3)',
  allocation_name VARCHAR(100) NOT NULL COMMENT 'Upah operator, Perawatan alat, Cadangan kas',
  rule_label VARCHAR(50) NOT NULL COMMENT 'dibayar dulu, sisa',
  CONSTRAINT fk_rules_block FOREIGN KEY (block_id) REFERENCES blocks(block_id) ON DELETE CASCADE
) ENGINE=InnoDB;


-- ============================================================================
-- BAGIAN 2: DATABASE VIEWS (AGREGASI OTOMATIS ANTAR HALAMAN)
-- ============================================================================

-- View A: Status Telemetri Terbaru Setiap Tong Pintar (Untuk Halaman: Tong)
CREATE OR REPLACE VIEW vw_latest_bin_status AS
SELECT 
  sb.bin_id,
  sb.block_id,
  b.block_name,
  sb.floor_number,
  sb.floor_label,
  sb.is_sensor_active,
  sb.fixed_schedule_note,
  COALESCE(tl.weight_kg, 0.00) AS weight_kg,
  COALESCE(tl.fill_percent, 0) AS fill_percent,
  COALESCE(tl.waste_age_hours, 0) AS waste_age_hours,
  tl.temperature_c,
  CASE 
    WHEN sb.is_sensor_active = FALSE THEN 'Sensor off'
    ELSE COALESCE(tl.status_badge, 'Aman')
  END AS status_badge,
  tl.recorded_at
FROM smart_bins sb
JOIN blocks b ON sb.block_id = b.block_id
LEFT JOIN bin_telemetry_logs tl ON tl.telemetry_id = (
  SELECT t2.telemetry_id
  FROM bin_telemetry_logs t2
  WHERE t2.bin_id = sb.bin_id
  ORDER BY t2.recorded_at DESC, t2.telemetry_id DESC
  LIMIT 1
);

-- View B: Ringkasan Saldo Kas Kelompok (Untuk Halaman: Kas)
CREATE OR REPLACE VIEW vw_cash_summary AS
SELECT 
  b.block_id,
  b.block_name,
  COALESCE(SUM(CASE WHEN ct.tx_type = 'INCOME' THEN ct.amount_idr ELSE 0 END), 0) AS total_pemasukan_idr,
  COALESCE(SUM(CASE WHEN ct.tx_type = 'EXPENSE' THEN ct.amount_idr ELSE 0 END), 0) AS total_pengeluaran_idr,
  COALESCE(SUM(CASE WHEN ct.tx_type = 'INCOME' THEN ct.amount_idr ELSE -ct.amount_idr END), 0) AS saldo_kas_idr
FROM blocks b
LEFT JOIN cash_transactions ct ON b.block_id = ct.block_id
GROUP BY b.block_id, b.block_name;

-- View C: Ringkasan Dampak Lingkungan & Emisi CO2e (Untuk Halaman: Dampak)
CREATE OR REPLACE VIEW vw_environmental_impact AS
SELECT 
  b.block_id,
  b.block_name,
  b.baseline_organic_kg_week,
  ROUND(COALESCE(SUM(wc.maggot_feed_kg + wc.composter_kg), 0), 1) AS total_organik_diolah_kg,
  ROUND((COALESCE(SUM(wc.maggot_feed_kg + wc.composter_kg), 0) * b.ipcc_emission_factor) / 1000, 1) AS emisi_dicegah_ton_co2e
FROM blocks b
LEFT JOIN smart_bins sb ON b.block_id = sb.block_id
LEFT JOIN waste_collections wc ON sb.bin_id = wc.bin_id
GROUP BY b.block_id, b.block_name, b.baseline_organic_kg_week, b.ipcc_emission_factor;


-- ============================================================================
-- BAGIAN 3: SEED DATA (DATA AWAL SESUAI TAMPILAN UI)
-- ============================================================================

INSERT INTO blocks (block_id, block_name, baseline_organic_kg_week, ipcc_emission_factor)
VALUES (1, '[nama blok]', 108.00, 0.5357);

INSERT INTO operators (operator_id, name, phone, is_active)
VALUES (1, 'Rina', '081234567890', TRUE);

-- Master Tong Lantai 1 - 5
INSERT INTO smart_bins (bin_id, block_id, floor_number, floor_label, max_capacity_kg, is_sensor_active, fixed_schedule_note) VALUES
(1, 1, 1, 'Lantai 1', 11.50, TRUE, NULL),
(2, 1, 2, 'Lantai 2', 11.50, TRUE, NULL),
(3, 1, 3, 'Lantai 3', 11.50, TRUE, NULL),
(4, 1, 4, 'Lantai 4', 11.50, TRUE, NULL),
(5, 1, 5, 'Lantai 5', 11.50, FALSE, 'Jadwal tetap: jemput tiap 2 hari');

-- Telemetri Terkini (Sesuai layar "Status Tong Pintar")
INSERT INTO bin_telemetry_logs (bin_id, weight_kg, fill_percent, waste_age_hours, temperature_c, status_badge, recorded_at) VALUES
(1, 4.10, 36, 12, 30.0, 'Aman',   '2026-11-12 07:40:00'),
(2, 7.90, 69, 30, 32.0, 'Segera', '2026-11-12 07:41:00'),
(3, 9.80, 85, 46, 34.0, 'Jemput', '2026-11-12 07:42:00'),
(4, 2.60, 23,  8, 30.0, 'Aman',   '2026-11-12 07:42:00');

-- Data Pengolahan (Sesuai layar "Olah")
INSERT INTO composter_drums (drum_id, block_id, drum_name, batch_start_date) VALUES
(1, 1, 'Drum komposter 1', '2026-11-04'), -- Hari ke-9 pada 12 Nov 2026
(2, 1, 'Drum komposter 2', '2026-11-10'); -- Hari ke-3 pada 12 Nov 2026

INSERT INTO composter_daily_logs (drum_id, log_date, temperature_c, turns_done, turns_target) VALUES
(1, '2026-11-12', 52.0, 2, 2),
(2, '2026-11-12', 38.0, 0, 2);

INSERT INTO maggot_oven_logs (block_id, log_date, feed_in_kg, prepupa_out_kg, has_mating_eggs, oven_fresh_in_kg, oven_dried_out_kg) VALUES
(1, '2026-11-12', 14.20, 1.10, TRUE, 3.00, 1.00);

-- Data Kas & Aturan Paguyuban (Sesuai layar "Kas", Total = Rp212.500)
INSERT INTO cash_transactions (block_id, operator_id, tx_date, tx_type, category, description, amount_idr) VALUES
(1, 1, '2026-11-03', 'INCOME', 'maggot_segar',  'Maggot segar 6 kg (lele)', 42000.00),
(1, 1, '2026-11-06', 'INCOME', 'maggot_kering', 'Maggot kering 2 kg',       70000.00),
(1, 1, '2026-11-08', 'INCOME', 'kasgot_kompos', 'Kasgot & kompos 20 kg',    40000.00),
(1, 1, '2026-11-10', 'INCOME', 'anorganik',     'Anorganik ke bank sampah', 33500.00),
(1, 1, '2026-11-12', 'INCOME', 'sayur',         'Sayur',                    27000.00);

INSERT INTO paguyuban_rules (block_id, priority_order, allocation_name, rule_label) VALUES
(1, 1, 'Upah operator',  'dibayar dulu'),
(1, 2, 'Perawatan alat', 'sisa'),
(1, 3, 'Cadangan kas',   'sisa');

-- Data Historis Setoran Minggu 1 s.d. Minggu 6 (Total Organik = 560 kg, sesuai layar "Dampak")
INSERT INTO waste_collections (bin_id, operator_id, collection_date, total_weight_kg, maggot_feed_kg, composter_kg, anorganik_kg, corridor_odor) VALUES
-- Minggu 1 (M1): 72 kg organik
(3, 1, '2026-10-08', 75.00, 58.00, 14.00, 3.00, 'Tidak'),
-- Minggu 2 (M2): 84 kg organik
(2, 1, '2026-10-15', 87.50, 68.00, 16.00, 3.50, 'Tidak'),
-- Minggu 3 (M3): 94 kg organik
(1, 1, '2026-10-22', 97.50, 76.00, 18.00, 3.50, 'Tidak'),
-- Minggu 4 (M4): 97 kg organik
(3, 1, '2026-10-29', 100.00, 79.00, 18.00, 3.00, 'Tidak'),
-- Minggu 5 (M5): 104 kg organik
(2, 1, '2026-11-05', 107.50, 84.00, 20.00, 3.50, 'Tidak'),
-- Minggu 6 (M6): 109 kg organik (rincian per lantai minggu ini)
(3, 1, '2026-11-11', 31.63, 25.00, 6.00, 0.63, 'Tidak'), -- Lantai 3: 31 kg organik · plastik ~2%
(1, 1, '2026-11-11', 28.13, 22.00, 5.00, 1.13, 'Tidak'), -- Lantai 1: 27 kg organik · plastik ~4%
(2, 1, '2026-11-11', 25.81, 19.50, 4.50, 1.81, 'Tidak'), -- Lantai 2: 24 kg organik · plastik ~7%
(4, 1, '2026-11-12', 16.84, 13.00, 3.00, 0.84, 'Tidak'), -- Lantai 4: 16 kg organik · plastik ~5%
(5, 1, '2026-11-12', 11.70,  9.00, 2.00, 0.70, 'Tidak'); -- Lantai 5: 11 kg organik · plastik ~6%


-- ============================================================================
-- BAGIAN 4: QUERY OPERASIONAL PER HALAMAN APLIKASI
-- ============================================================================

-- ----------------------------------------------------------------------------
-- [HALAMAN 1: TONG] - Menampilkan Banner Peringatan & Daftar Lantai 1-5
-- ----------------------------------------------------------------------------
-- 1A. Ambil daftar status seluruh tong di Blok 1
SELECT 
  floor_number,
  floor_label,
  status_badge,
  weight_kg,
  fill_percent,
  waste_age_hours,
  temperature_c,
  fixed_schedule_note
FROM vw_latest_bin_status
WHERE block_id = 1
ORDER BY floor_number ASC;

-- 1B. Ambil tong prioritas yang perlu segera dijemput (Banner Peringatan Merah)
SELECT 
  floor_label,
  fill_percent,
  waste_age_hours
FROM vw_latest_bin_status
WHERE block_id = 1 AND status_badge = 'Jemput'
ORDER BY fill_percent DESC, waste_age_hours DESC
LIMIT 1;


-- ----------------------------------------------------------------------------
-- [HALAMAN 2: CATAT] - Tarik Sensor & Simpan Hasil Pemilahan
-- ----------------------------------------------------------------------------
-- 2A. Query tombol "Ambil dari sensor" saat operator memilih Lantai 3 (bin_id = 3)
SELECT 
  weight_kg,
  is_sensor_active
FROM vw_latest_bin_status
WHERE bin_id = 3;

-- 2B. Simpan setoran baru & reset status tong menjadi "Aman" (dalam 1 transaksi)
START TRANSACTION;

INSERT INTO waste_collections (
  bin_id, operator_id, collection_date,
  total_weight_kg, maggot_feed_kg, composter_kg, anorganik_kg,
  corridor_odor, photo_url
) VALUES (
  3, 1, '2026-11-12',
  9.80, 7.60, 1.70, 0.50,
  'Tidak', NULL
);

-- Reset telemetri tong Lantai 3 setelah sampah diangkut
INSERT INTO bin_telemetry_logs (
  bin_id, weight_kg, fill_percent, waste_age_hours, temperature_c, status_badge
) VALUES (
  3, 0.00, 0, 0, 29.0, 'Aman'
);

COMMIT;


-- ----------------------------------------------------------------------------
-- [HALAMAN 3: OLAH] - Pemantauan Drum Komposter, Maggot, Oven & Panen
-- ----------------------------------------------------------------------------
-- 3A. Ambil status Drum Komposter 1 & 2 hari ini (menghitung Hari ke-N otomatis)
SELECT 
  cd.drum_id,
  cd.drum_name,
  CONCAT('Hari ke-', DATEDIFF('2026-11-12', cd.batch_start_date) + 1) AS hari_ke,
  cdl.temperature_c,
  cdl.turns_done,
  cdl.turns_target,
  CASE 
    WHEN cdl.turns_done = 0 THEN 'Belum diputar hari ini'
    ELSE 'Sudah diputar'
  END AS keterangan_putar
FROM composter_drums cd
JOIN composter_daily_logs cdl ON cd.drum_id = cdl.drum_id
WHERE cd.block_id = 1 AND cdl.log_date = '2026-11-12'
ORDER BY cd.drum_id ASC;

-- 3B. Catat 1x putaran pada Drum Komposter 2
UPDATE composter_daily_logs
SET turns_done = LEAST(turns_done + 1, turns_target)
WHERE drum_id = 2 AND log_date = '2026-11-12';

-- 3C. Ambil data Lemari Maggot & Oven Surya hari ini
SELECT 
  feed_in_kg,
  prepupa_out_kg,
  has_mating_eggs,
  oven_fresh_in_kg,
  oven_dried_out_kg
FROM maggot_oven_logs
WHERE block_id = 1 AND log_date = '2026-11-12';

-- 3D. Simpan catatan panen baru (Tombol: + Catat panen / kasgot / kompos)
INSERT INTO harvest_logs (block_id, operator_id, harvest_type, weight_kg, notes, harvest_date)
VALUES (1, 1, 'kasgot', 15.00, 'Kasgot kering siap kemas', '2026-11-12');


-- ----------------------------------------------------------------------------
-- [HALAMAN 4: KAS] - Saldo Kas, Pemasukan & Aturan Pembagian Paguyuban
-- ----------------------------------------------------------------------------
-- 4A. Ambil Saldo Kas terkini (Rp212.500)
SELECT saldo_kas_idr
FROM vw_cash_summary
WHERE block_id = 1;

-- 4B. Ambil rincian daftar Pemasukan bulan November 2026
SELECT 
  description,
  amount_idr
FROM cash_transactions
WHERE block_id = 1
  AND tx_type = 'INCOME'
  AND tx_date BETWEEN '2026-11-01' AND '2026-11-30'
ORDER BY tx_date ASC, tx_id ASC;

-- 4C. Ambil daftar Pembagian (aturan paguyuban)
SELECT 
  priority_order,
  allocation_name,
  rule_label
FROM paguyuban_rules
WHERE block_id = 1
ORDER BY priority_order ASC;

-- 4D. Tambah transaksi penjualan / pengeluaran baru
INSERT INTO cash_transactions (block_id, operator_id, tx_date, tx_type, category, description, amount_idr)
VALUES (1, 1, '2026-11-12', 'INCOME', 'maggot_segar', 'Maggot segar 4 kg', 28000.00);


-- ----------------------------------------------------------------------------
-- [HALAMAN 5: DAMPAK] - Ringkasan Emisi, Grafik M1-M6 & Ranking Per Lantai
-- ----------------------------------------------------------------------------
-- 5A. Ambil ringkasan total organik diolah (560 kg) & emisi dicegah (± 0,3 t CO2e)
SELECT 
  total_organik_diolah_kg,
  emisi_dicegah_ton_co2e,
  baseline_organic_kg_week
FROM vw_environmental_impact
WHERE block_id = 1;

-- 5B. Data Grafik Batang "Sampah organik per minggu (kg)" (M1 s.d. M6)
SELECT 
  CONCAT('M', TIMESTAMPDIFF(WEEK, '2026-10-05', wc.collection_date) + 1) AS minggu_kode,
  ROUND(SUM(wc.maggot_feed_kg + wc.composter_kg), 0) AS organik_kg
FROM waste_collections wc
JOIN smart_bins sb ON wc.bin_id = sb.bin_id
WHERE sb.block_id = 1
GROUP BY minggu_kode
ORDER BY MIN(wc.collection_date) ASC;

-- 5C. Daftar peringkat "Per lantai minggu ini" (Top 3 lantai dengan organik terbanyak)
SELECT 
  sb.floor_label,
  ROUND(SUM(wc.maggot_feed_kg + wc.composter_kg), 0) AS organik_kg,
  ROUND((SUM(wc.anorganik_kg) / NULLIF(SUM(wc.total_weight_kg), 0)) * 100, 0) AS plastik_persen
FROM waste_collections wc
JOIN smart_bins sb ON wc.bin_id = sb.bin_id
WHERE sb.block_id = 1
  AND wc.collection_date BETWEEN '2026-11-09' AND '2026-11-15'
GROUP BY sb.bin_id, sb.floor_label
ORDER BY organik_kg DESC
LIMIT 3;