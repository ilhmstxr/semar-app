import app from './app.js';
import { config } from './config/env.js';

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  SEMAR Web Service API is running!`);
  console.log(`  Environment: ${config.nodeEnv}`);
  console.log(`  Port       : ${PORT}`);
  console.log(`  URL        : http://localhost:${PORT}`);
  console.log(`  Health API : http://localhost:${PORT}/api/health`);
  console.log(`  Scalar Docs: http://localhost:${PORT}/docs/api`);
  console.log(`===============================================`);
});
