import express from 'express';
import {
  getKasSummaryAndTransactions,
  createTransaction,
  deleteTransaction,
} from '../controllers/kasController.js';

const router = express.Router();

router.get('/', getKasSummaryAndTransactions);
router.post('/', createTransaction);
router.delete('/:id', deleteTransaction);

export default router;
