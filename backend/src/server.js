import app from './app.js';
import { config } from './config/env.js';

const PORT = config.port;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`===============================================`);
  console.log(`  SEMAR Web Service API is running!`);
  console.log(`  Environment: ${config.nodeEnv}`);
  console.log(`  Port       : ${PORT}`);
  console.log(`  Local URL  : http://localhost:${PORT}`);
  console.log(`  LAN URL    : http://192.168.110.77:${PORT}`);
  console.log(`  Scalar Docs: http://localhost:${PORT}/docs/api`);
  console.log(`===============================================`);
});
