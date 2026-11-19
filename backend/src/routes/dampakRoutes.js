import express from 'express';
import { getDampak, updateDampak } from '../controllers/dampakController.js';

const router = express.Router();

router.get('/', getDampak);
router.put('/', updateDampak);

export default router;
