import express from 'express';
import binRoutes from './binRoutes.js';
import catatRoutes from './catatRoutes.js';
import olahRoutes from './olahRoutes.js';
import kasRoutes from './kasRoutes.js';
import dampakRoutes from './dampakRoutes.js';

const router = express.Router();

// Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'SEMAR Web Service API',
    timestamp: new Date().toISOString(),
  });
});

// Resource Routes
router.use('/bins', binRoutes);
router.use('/catat', catatRoutes);
router.use('/olah', olahRoutes);
router.use('/kas', kasRoutes);
router.use('/dampak', dampakRoutes);

export default router;
