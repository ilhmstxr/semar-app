import pool, { query } from '../config/db.js';
import { binsData } from '../data/initialData.js';

// Helper formatting bin response
const formatBinRow = (row) => ({
  id: row.id,
  floor: row.floor,
  status: row.status,
  weightKg: parseFloat(row.weightKg || 0),
  ageHours: parseInt(row.ageHours || 0, 10),
  tempC: row.tempC !== null ? parseFloat(row.tempC) : null,
  percent: parseInt(row.percent || 0, 10),
  sensorActive: Boolean(row.sensorActive),
  fixedSchedule: row.fixedSchedule || '',
  recordedAt: row.recordedAt || null,
});

// @desc    Get all bins status (latest IoT telemetry per floor)
// @route   GET /api/bins
export const getBins = async (req, res, next) => {
  try {
    const sql = `
      SELECT 
        sb.bin_id AS id,
        sb.floor_label AS floor,
        sb.floor_number,
        CASE 
          WHEN sb.is_sensor_active = 0 THEN 'Sensor off'
          ELSE COALESCE(tl.status_badge, 'Aman')
        END AS status,
        COALESCE(tl.weight_kg, 0.00) AS weightKg,
        COALESCE(tl.waste_age_hours, 0) AS ageHours,
        tl.temperature_c AS tempC,
        COALESCE(tl.fill_percent, 0) AS percent,
        sb.is_sensor_active AS sensorActive,
        COALESCE(sb.fixed_schedule_note, '') AS fixedSchedule,
        tl.recorded_at AS recordedAt
      FROM smart_bins sb
      LEFT JOIN bin_telemetry_logs tl ON tl.telemetry_id = (
        SELECT t2.telemetry_id
        FROM bin_telemetry_logs t2
        WHERE t2.bin_id = sb.bin_id
        ORDER BY t2.recorded_at DESC, t2.telemetry_id DESC
        LIMIT 1
      )
      ORDER BY sb.floor_number ASC;
    `;
    const rows = await query(sql);
    const data = rows.map(formatBinRow);

    res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.warn('[binController] Fallback ke in-memory binsData karena DB error:', error.message);
    res.json({
      success: true,
      count: binsData.length,
      data: binsData,
      isFallback: true,
    });
  }
};

// @desc    Get single bin with latest telemetry
// @route   GET /api/bins/:id
export const getBinById = async (req, res, next) => {
  const binId = parseInt(req.params.id, 10);

  try {
    const sql = `
      SELECT 
        sb.bin_id AS id,
        sb.floor_label AS floor,
        sb.floor_number,
        CASE 
          WHEN sb.is_sensor_active = 0 THEN 'Sensor off'
          ELSE COALESCE(tl.status_badge, 'Aman')
        END AS status,
        COALESCE(tl.weight_kg, 0.00) AS weightKg,
        COALESCE(tl.waste_age_hours, 0) AS ageHours,
        tl.temperature_c AS tempC,
        COALESCE(tl.fill_percent, 0) AS percent,
        sb.is_sensor_active AS sensorActive,
        COALESCE(sb.fixed_schedule_note, '') AS fixedSchedule,
        tl.recorded_at AS recordedAt
      FROM smart_bins sb
      LEFT JOIN bin_telemetry_logs tl ON tl.telemetry_id = (
        SELECT t2.telemetry_id
        FROM bin_telemetry_logs t2
        WHERE t2.bin_id = sb.bin_id
        ORDER BY t2.recorded_at DESC, t2.telemetry_id DESC
        LIMIT 1
      )
      WHERE sb.bin_id = ?;
    `;
    const rows = await query(sql, [binId]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Tong sampah tidak ditemukan' });
    }

    res.json({ success: true, data: formatBinRow(rows[0]) });
  } catch (error) {
    console.warn('[binController] Fallback ke in-memory binsData:', error.message);
    const bin = binsData.find((b) => b.id === binId);
    if (!bin) {
      return res.status(404).json({ success: false, message: 'Tong sampah tidak ditemukan' });
    }
    res.json({ success: true, data: bin, isFallback: true });
  }
};

// @desc    Record new IoT sensor telemetry for a bin
// @route   POST /api/bins/:id/telemetry or POST /api/bins/telemetry
export const recordTelemetry = async (req, res, next) => {
  const binId = parseInt(req.params.id || req.body.bin_id || req.body.binId, 10);
  const {
    weight_kg = 0,
    fill_percent = 0,
    waste_age_hours = 0,
    temperature_c = 30.0,
  } = req.body;

  if (!binId) {
    return res.status(400).json({ success: false, message: 'ID tong sampah (bin_id) wajib diisi' });
  }

  // Tentukan badge status secara otomatis jika tidak disediakan
  let statusBadge = req.body.status_badge || req.body.status;
  if (!statusBadge) {
    if (fill_percent >= 80 || weight_kg >= 9) {
      statusBadge = 'Jemput';
    } else if (fill_percent >= 60 || weight_kg >= 7) {
      statusBadge = 'Segera';
    } else {
      statusBadge = 'Aman';
    }
  }

  try {
    const insertSql = `
      INSERT INTO bin_telemetry_logs (
        bin_id, weight_kg, fill_percent, waste_age_hours, temperature_c, status_badge, recorded_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW());
    `;
    const result = await query(insertSql, [
      binId,
      parseFloat(weight_kg),
      parseInt(fill_percent, 10),
      parseInt(waste_age_hours, 10),
      temperature_c !== null ? parseFloat(temperature_c) : null,
      statusBadge,
    ]);

    res.status(201).json({
      success: true,
      message: 'Data telemetri IoT berhasil disimpan ke database',
      telemetryId: result.insertId,
      data: {
        binId,
        weightKg: parseFloat(weight_kg),
        fillPercent: parseInt(fill_percent, 10),
        wasteAgeHours: parseInt(waste_age_hours, 10),
        temperatureC: parseFloat(temperature_c),
        statusBadge,
        recordedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark bin as picked up (resets telemetry to 0 kg & Aman in DB)
// @route   POST /api/bins/:id/pickup
export const pickUpBin = async (req, res, next) => {
  const binId = parseInt(req.params.id, 10);

  try {
    // Masukkan log baru dengan bobot 0 dan status Aman
    const sql = `
      INSERT INTO bin_telemetry_logs (
        bin_id, weight_kg, fill_percent, waste_age_hours, temperature_c, status_badge, recorded_at
      ) VALUES (?, 0.00, 0, 0, 29.0, 'Aman', NOW());
    `;
    await query(sql, [binId]);

    // Update juga di in-memory untuk konsistensi fallback
    const memBin = binsData.find((b) => b.id === binId);
    if (memBin) {
      memBin.weightKg = 0;
      memBin.percent = 0;
      memBin.ageHours = 0;
      memBin.status = 'Aman';
    }

    res.json({
      success: true,
      message: `Tong di lantai #${binId} berhasil ditandai sudah dijemput`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle sensor active state
// @route   PATCH /api/bins/:id/toggle-sensor
export const toggleBinSensor = async (req, res, next) => {
  const binId = parseInt(req.params.id, 10);

  try {
    // Ambil status saat ini
    const [bin] = await query('SELECT is_sensor_active, floor_label FROM smart_bins WHERE bin_id = ?', [binId]);
    if (!bin) {
      return res.status(404).json({ success: false, message: 'Tong sampah tidak ditemukan' });
    }

    const newSensorState = bin.is_sensor_active ? 0 : 1;
    await query('UPDATE smart_bins SET is_sensor_active = ? WHERE bin_id = ?', [newSensorState, binId]);

    // Masukkan log telemetri penyesuaian jika sensor dimatikan
    if (!newSensorState) {
      await query(`
        INSERT INTO bin_telemetry_logs (
          bin_id, weight_kg, fill_percent, waste_age_hours, temperature_c, status_badge, recorded_at
        ) VALUES (?, 0.00, 0, 0, NULL, 'Sensor off', NOW())
      `, [binId]);
    }

    res.json({
      success: true,
      message: `Sensor ${bin.floor_label} ${newSensorState ? 'diaktifkan' : 'dimatikan'}`,
      sensorActive: Boolean(newSensorState),
    });
  } catch (error) {
    next(error);
  }
};
