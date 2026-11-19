import express from 'express';
import { apiReference } from '@scalar/express-api-reference';
import { openApiSpec } from '../docs/openapi.js';

const router = express.Router();

// Endpoint untuk raw OpenAPI JSON specification
router.get('/openapi.json', (req, res) => {
  res.json(openApiSpec);
});

// Endpoint Scalar Interactive API Reference
router.use(
  '/',
  apiReference({
    pageTitle: 'SEMAR API Documentation',
    theme: 'saturn',
    spec: {
      content: openApiSpec,
    },
  })
);

export default router;
