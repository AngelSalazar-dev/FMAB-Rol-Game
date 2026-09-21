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

async function initDatabase() {
  console.log('Inicializando base de datos FMAB...');

  try {
    const connection = await pool.getConnection();
    console.log('Conexión exitosa a TiDB Cloud');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS characters (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        origin ENUM('central', 'ishval', 'drachma', 'xing') DEFAULT 'central',
        history ENUM('alchemist', 'soldier', 'civilian', 'prisoner') DEFAULT 'civilian',
        seen_gate BOOLEAN DEFAULT FALSE,
        appearance JSON,
        attributes JSON,
        skills JSON,
        hp INT DEFAULT 100,
        max_hp INT DEFAULT 100,
        stress INT DEFAULT 0,
        max_stress INT DEFAULT 100,
        sanity INT DEFAULT 100,
        max_sanity INT DEFAULT 100,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Tabla characters creada/verificada');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS saves (
        id INT PRIMARY KEY AUTO_INCREMENT,
        character_id INT NOT NULL,
        mode ENUM('freedom', 'story') DEFAULT 'freedom',
        state JSON NOT NULL,
        turn_count INT DEFAULT 0,
        decision_history JSON,
        is_alive BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
      )
    `);
    console.log('Tabla saves creada/verificada');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS inventory (
        id INT PRIMARY KEY AUTO_INCREMENT,
        save_id INT NOT NULL,
        item_name VARCHAR(100) NOT NULL,
        quantity INT DEFAULT 1,
        item_type ENUM('material', 'weapon', 'tool', 'consumable', 'key') DEFAULT 'material',
        properties JSON,
        FOREIGN KEY (save_id) REFERENCES saves(id) ON DELETE CASCADE
      )
    `);
    console.log('Tabla inventory creada/verificada');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS factions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        save_id INT NOT NULL,
        faction_name VARCHAR(100) NOT NULL,
        reputation INT DEFAULT 0,
        suspicion_level INT DEFAULT 0,
        FOREIGN KEY (save_id) REFERENCES saves(id) ON DELETE CASCADE
      )
    `);
    console.log('Tabla factions creada/verificada');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS companions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        save_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        loyalty INT DEFAULT 50,
        is_alive BOOLEAN DEFAULT TRUE,
        status ENUM('active', 'injured', 'missing', 'dead') DEFAULT 'active',
        personality JSON,
        FOREIGN KEY (save_id) REFERENCES saves(id) ON DELETE CASCADE
      )
    `);
    console.log('Tabla companions creada/verificada');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS injuries (
        id INT PRIMARY KEY AUTO_INCREMENT,
        save_id INT NOT NULL,
        body_part VARCHAR(50) NOT NULL,
        injury_type VARCHAR(100) NOT NULL,
        severity ENUM('light', 'moderate', 'severe', 'critical') DEFAULT 'light',
        treated BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (save_id) REFERENCES saves(id) ON DELETE CASCADE
      )
    `);
    console.log('Tabla injuries creada/verificada');

    connection.release();
    console.log('Base de datos inicializada correctamente');
    process.exit(0);
  } catch (error) {
    console.error('Error inicializando base de datos:', error);
    process.exit(1);
  }
}

initDatabase();