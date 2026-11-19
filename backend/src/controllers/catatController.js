import { query } from '../config/db.js';
import { sensorDataByFloor, setoranHistory, binsData } from '../data/initialData.js';

// @desc    Get real-time sensor weight per floor from DB
// @route   GET /api/catat/sensor-weights
export const getSensorWeights = async (req, res, next) => {
  try {
    const sql = `
      SELECT 
        floor_label,
        weight_kg,
        is_sensor_active
      FROM vw_latest_bin_status
      ORDER BY floor_number ASC;
    `;
    const rows = await query(sql);

    const result = {};
    rows.forEach((r) => {
      result[r.floor_label] = {
        active: Boolean(r.is_sensor_active),
        weight: parseFloat(r.weight_kg || 0),
      };
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.warn('[catatController] Fallback sensor weights:', error.message);
    res.json({
      success: true,
      data: sensorDataByFloor,
      isFallback: true,
    });
  }
};

// @desc    Get all setoran records from DB
// @route   GET /api/catat/history
export const getSetoranHistory = async (req, res, next) => {
  try {
    const sql = `
      SELECT 
        wc.collection_id AS id,
        COALESCE(sb.floor_label, CONCAT('Lantai ', wc.bin_id)) AS floor,
        DATE_FORMAT(wc.created_at, '%H:%i') AS time,
        DATE_FORMAT(wc.created_at, '%Y-%m-%d %H:%i:%s') AS formattedDateTime,
        wc.collection_date AS collectionDate,
        CAST(wc.total_weight_kg AS DECIMAL(6,2)) AS totalWeight,
        CAST(wc.maggot_feed_kg AS DECIMAL(6,2)) AS maggotKg,
        CAST(wc.composter_kg AS DECIMAL(6,2)) AS komposterKg,
        CAST(wc.anorganik_kg AS DECIMAL(6,2)) AS anorganikKg,
        wc.corridor_odor AS corridorOdor,
        wc.photo_url AS photoUrl,
        COALESCE(op.name, 'Operator') AS operator,
        wc.created_at AS createdAt
      FROM waste_collections wc
      LEFT JOIN smart_bins sb ON wc.bin_id = sb.bin_id
      LEFT JOIN operators op ON wc.operator_id = op.operator_id
      ORDER BY wc.created_at DESC, wc.collection_id DESC;
    `;
    const rows = await query(sql);

    const formatted = rows.map((r) => ({
      id: r.id,
      floor: r.floor,
      time: r.time,
      formattedDateTime: r.formattedDateTime,
      collectionDate: r.collectionDate,
      totalWeight: parseFloat(r.totalWeight || 0),
      maggotKg: parseFloat(r.maggotKg || 0),
      composterKg: parseFloat(r.composterKg || 0),
      anorganikKg: parseFloat(r.anorganikKg || 0),
      corridorOdor: r.corridorOdor || 'Tidak',
      photoUrl: r.photoUrl || null,
      photoUri: r.photoUrl || null,
      operator: r.operator,
      createdAt: r.createdAt,
    }));

    res.json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    console.warn('[catatController] Fallback setoran history:', error.message);
    res.json({
      success: true,
      count: setoranHistory.length,
      data: setoranHistory,
      isFallback: true,
    });
  }
};

// @desc    Upload photo evidence (Max 5MB)
// @route   POST /api/catat/upload
export const uploadPhoto = (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Tidak ada file foto yang diunggah',
    });
  }

  const relativePath = `/uploads/${req.file.filename}`;
  res.json({
    success: true,
    message: 'Foto berhasil diunggah',
    photoUrl: relativePath,
    filename: req.file.filename,
    size: req.file.size,
  });
};

// @desc    Create new setoran & pilah record in DB
// @route   POST /api/catat
export const createSetoran = async (req, res, next) => {
  try {
    const {
      floor,
      totalWeight,
      maggotKg = 0,
      komposterKg = 0,
      anorganikKg = 0,
      operator = 'Rina',
      corridorOdor = 'Tidak',
    } = req.body;

    let photoUrl = req.body.photoUrl || req.body.photoUri || null;
    if (req.file) {
      photoUrl = `/uploads/${req.file.filename}`;
    }

    if (!floor || totalWeight === undefined || totalWeight === null) {
      return res.status(400).json({
        success: false,
        message: 'Lantai dan berat total harus diisi',
      });
    }

    const numTotal = Math.round(parseFloat(totalWeight) * 100) / 100;
    const numMaggot = Math.round(parseFloat(maggotKg || 0) * 100) / 100;
    const numKomposter = Math.round(parseFloat(komposterKg || 0) * 100) / 100;
    const numAnorganik = Math.round(parseFloat(anorganikKg || 0) * 100) / 100;

    // 2b: Akumulasi pemilahan maksimal adalah dari hasil berat total masuk
    const sumPilah = Math.round((numMaggot + numKomposter + numAnorganik) * 100) / 100;
    if (sumPilah > numTotal + 0.05) {
      return res.status(400).json({
        success: false,
        message: `Akumulasi hasil pemilahan (${sumPilah} kg) melebihi berat total masuk (${numTotal} kg)`,
      });
    }

    // 2c: Validasi opsi bau lorong
    const validOdors = ['Tidak', 'Sedikit tercium', 'Ya, menyengat'];
    const odorValue = validOdors.includes(corridorOdor) ? corridorOdor : 'Tidak';

    // Cari atau buat operator
    let operatorId = 1;
    try {
      const opRows = await query('SELECT operator_id FROM operators WHERE name = ? LIMIT 1', [operator]);
      if (opRows && opRows.length > 0) {
        operatorId = opRows[0].operator_id;
      } else {
        const insertOp = await query('INSERT INTO operators (name) VALUES (?)', [operator]);
        operatorId = insertOp.insertId;
      }
    } catch {
      operatorId = 1;
    }

    // Cari bin_id dari floor label / number
    let binId = 1;
    try {
      const binRows = await query('SELECT bin_id FROM smart_bins WHERE floor_label = ? OR floor_number = ? LIMIT 1', [
        floor,
        parseInt(String(floor).replace(/[^0-9]/g, ''), 10) || 1,
      ]);
      if (binRows && binRows.length > 0) {
        binId = binRows[0].bin_id;
      }
    } catch {
      binId = parseInt(String(floor).replace(/[^0-9]/g, ''), 10) || 1;
    }

    // 2a: Timestamp realtime tersimpan waktu sekarang (Tahun, Bulan, Tanggal, Jam, Menit, Detik)
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const currentDateTimeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const collectionDateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    // Simpan ke tabel waste_collections
    const insertSql = `
      INSERT INTO waste_collections (r
        bin_id, operator_id, collection_date, total_weight_kg,
        maggot_feed_kg, composter_kg, anorganik_kg,
        corridor_odor, photo_url, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    const insertResult = await query(insertSql, [
      binId,
      operatorId,
      collectionDateStr,
      numTotal,
      numMaggot,
      numKomposter,
      numAnorganik,
      odorValue,
      photoUrl,
      currentDateTimeStr,
    ]);

    const newId = insertResult.insertId;

    // Reset status telemetri tong terkait menjadi 0 kg dan Aman
    await query(`
      INSERT INTO bin_telemetry_logs (
        bin_id, weight_kg, fill_percent, waste_age_hours, temperature_c, status_badge, recorded_at
      ) VALUES (?, 0.00, 0, 0, 29.0, 'Aman', NOW());
    `, [binId]);

    // Update in-memory fallback juga
    const timeFormatted = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const newRecord = {
      id: newId,
      floor,
      time: timeFormatted,
      formattedDateTime: currentDateTimeStr,
      collectionDate: collectionDateStr,
      totalWeight: numTotal,
      maggotKg: numMaggot,
      komposterKg: numKomposter,
      anorganikKg: numAnorganik,
      corridorOdor: odorValue,
      photoUrl,
      photoUri: photoUrl,
      operator,
      createdAt: currentDateTimeStr,
    };
    setoranHistory.unshift(newRecord);

    res.status(201).json({
      success: true,
      message: 'Setoran berhasil dicatat dan disimpan ke database',
      data: newRecord,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete setoran record from DB
// @route   DELETE /api/catat/:id
export const deleteSetoran = async (req, res, next) => {
  const id = parseInt(req.params.id, 10);

  try {
    const result = await query('DELETE FROM waste_collections WHERE collection_id = ?', [id]);

    if (result.affectedRows === 0) {
      // Cek in-memory fallback
      const index = setoranHistory.findIndex((item) => item.id === id);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Data setoran tidak ditemukan' });
      }
      const deleted = setoranHistory.splice(index, 1);
      return res.json({
        success: true,
        message: 'Data setoran berhasil dihapus (in-memory)',
        data: deleted[0],
      });
    }

    res.json({
      success: true,
      message: 'Data setoran berhasil dihapus dari database',
      deletedId: id,
    });
  } catch (error) {
    next(error);
  }
};
