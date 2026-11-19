import mysql from 'mysql2/promise';
import { config } from './env.js';

let pool = null;

try {
  pool = mysql.createPool({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
  });

  // Test connection asynchronously
  pool.getConnection()
    .then((conn) => {
      console.log(`[Database] Terhubung ke MySQL '${config.db.database}' di ${config.db.host}:${config.db.port}`);
      conn.release();
    })
    .catch((err) => {
      console.error('[Database] Gagal terhubung ke MySQL:', err.message);
    });
} catch (error) {
  console.error('[Database] Inisialisasi pool gagal:', error.message);
}

export const query = async (sql, params = []) => {
  if (!pool) {
    throw new Error('Database pool belum siap');
  }
  const [results] = await pool.query(sql, params);
  return results;
};

export default pool;
