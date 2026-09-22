const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  const url = new URL(process.env.DATABASE_URL);
  const pool = mysql.createPool({
    host: url.hostname,
    port: parseInt(url.port || '4000'),
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Check if messages column exists
    const [columns] = await pool.query("SHOW COLUMNS FROM saves LIKE 'messages'");
    if (columns.length === 0) {
      await pool.query('ALTER TABLE saves ADD COLUMN messages JSON');
      console.log('✓ Column "messages" added to saves table');
    } else {
      console.log('✓ Column "messages" already exists');
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}

migrate();
