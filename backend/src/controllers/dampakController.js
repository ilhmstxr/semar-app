import { dampakData } from '../data/initialData.js';

// @desc    Get environmental impact statistics
// @route   GET /api/dampak
export const getDampak = (req, res) => {
  res.json({
    success: true,
    data: dampakData,
  });
};

// @desc    Update environmental impact data
// @route   PUT /api/dampak
export const updateDampak = (req, res) => {
  Object.assign(dampakData, req.body);

  res.json({
    success: true,
    message: 'Data dampak lingkungan berhasil diperbarui',
    data: dampakData,
  });
};
