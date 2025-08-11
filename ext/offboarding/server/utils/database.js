import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'your_root_password_here',
  database: process.env.DB_NAME || 'offboarding',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function executeQuery(query, values) {
  const [rows] = await pool.query(query, values);
  return rows;
}

export default pool;
