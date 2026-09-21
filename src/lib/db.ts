import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.DATABASE_URL || '';
const url = new URL(dbUrl);

const pool = mysql.createPool({
  host: url.hostname,
  port: parseInt(url.port || '4000'),
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 5,
});

export default pool;