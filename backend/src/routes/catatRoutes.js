import express from 'express';
import {
  getSensorWeights,
  getSetoranHistory,
  createSetoran,
  deleteSetoran,
  uploadPhoto,
} from '../controllers/catatController.js';
import { upload } from '../middlewares/upload.js';

const router = express.Router();

router.get('/sensor-weights', getSensorWeights);
router.get('/history', getSetoranHistory);
router.post('/upload', upload.single('photo'), uploadPhoto);
router.post('/', upload.single('photo'), createSetoran);
router.delete('/:id', deleteSetoran);

export default router;
