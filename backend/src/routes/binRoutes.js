import express from 'express';
import {
  getBins,
  getBinById,
  recordTelemetry,
  pickUpBin,
  toggleBinSensor,
} from '../controllers/binController.js';

const router = express.Router();

router.get('/', getBins);
router.get('/:id', getBinById);
router.post('/telemetry', recordTelemetry);
router.post('/:id/telemetry', recordTelemetry);
router.post('/:id/pickup', pickUpBin);
router.patch('/:id/toggle-sensor', toggleBinSensor);

export default router;
