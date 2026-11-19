import { drumsData, maggotStatus, harvestLogs } from '../data/initialData.js';

// @desc    Get drums data
// @route   GET /api/olah/drums
export const getDrums = (req, res) => {
  res.json({
    success: true,
    data: drumsData,
  });
};

// @desc    Update drum metrics
// @route   PUT /api/olah/drums/:id
export const updateDrum = (req, res) => {
  const id = parseInt(req.params.id, 10);
  const index = drumsData.findIndex((d) => d.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Drum tidak ditemukan' });
  }

  drumsData[index] = {
    ...drumsData[index],
    ...req.body,
    id,
  };

  res.json({
    success: true,
    message: 'Data drum berhasil diperbarui',
    data: drumsData[index],
  });
};

// @desc    Get maggot bioconversion status
// @route   GET /api/olah/maggot
export const getMaggotStatus = (req, res) => {
  res.json({
    success: true,
    data: maggotStatus,
  });
};

// @desc    Update maggot bioconversion status
// @route   PUT /api/olah/maggot
export const updateMaggotStatus = (req, res) => {
  Object.assign(maggotStatus, req.body);

  res.json({
    success: true,
    message: 'Status biokonversi maggot berhasil diperbarui',
    data: maggotStatus,
  });
};

// @desc    Get harvest logs
// @route   GET /api/olah/harvests
export const getHarvestLogs = (req, res) => {
  res.json({
    success: true,
    count: harvestLogs.length,
    data: harvestLogs,
  });
};

// @desc    Create harvest log
// @route   POST /api/olah/harvests
export const createHarvestLog = (req, res) => {
  const { type, weightKg, note = '' } = req.body;

  if (!type || weightKg === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Tipe panen dan berat (kg) wajib diisi',
    });
  }

  const now = new Date();
  const timeFormatted = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');

  const newLog = {
    id: harvestLogs.length > 0 ? Math.max(...harvestLogs.map((l) => l.id)) + 1 : 1,
    time: timeFormatted,
    type,
    weightKg: Number(weightKg),
    note,
    createdAt: now.toISOString(),
  };

  harvestLogs.unshift(newLog);

  res.status(201).json({
    success: true,
    message: 'Catatan panen berhasil ditambahkan',
    data: newLog,
  });
};
