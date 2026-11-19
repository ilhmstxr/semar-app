import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/index.js';
import docRoutes from './routes/docRoutes.js';
import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for photo uploads
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// Root welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Selamat datang di SEMAR Web Service API',
    version: '1.0.0',
    documentation: '/docs/api',
    endpoints: {
      documentation: '/docs/api',
      health: '/api/health',
      bins: '/api/bins',
      catat: '/api/catat',
      olah: '/api/olah',
      kas: '/api/kas',
      dampak: '/api/dampak',
    },
  });
});

// Scalar API Documentation route
app.use('/docs/api', docRoutes);

// Mount API routes
app.use('/api', apiRoutes);

// Fallback Middlewares
app.use(notFound);
app.use(errorHandler);

export default app;
