import express from 'express';
import {
  getDrums,
  updateDrum,
  getMaggotStatus,
  updateMaggotStatus,
  getHarvestLogs,
  createHarvestLog,
} from '../controllers/olahController.js';

const router = express.Router();

router.get('/drums', getDrums);
router.put('/drums/:id', updateDrum);

router.get('/maggot', getMaggotStatus);
router.put('/maggot', updateMaggotStatus);

router.get('/harvests', getHarvestLogs);
router.post('/harvests', createHarvestLog);

export default router;
