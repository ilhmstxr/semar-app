import { config } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'Ukuran file foto melebihi batas maksimal 5MB.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: config.nodeEnv === 'production' ? null : err.stack,
  });
};
