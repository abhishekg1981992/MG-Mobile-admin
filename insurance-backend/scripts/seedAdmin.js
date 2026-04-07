// Seed script to create initial admin user.
import pool from '../src/config/db.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

const username = process.env.SEED_ADMIN_USER || 'admin';
const password = process.env.SEED_ADMIN_PASS || 'admin';
const name = process.env.SEED_ADMIN_NAME || 'Super Admin';

const run = async () => {
  try {
    const hash = await bcrypt.hash(password, 10);
    const [rows] = await pool.query('SELECT * FROM admins WHERE username=?', [username]);
    if (rows.length) {
      console.log('Admin exists. Skipping.');
      process.exit(0);
    }
    await pool.query('INSERT INTO admins (username, password, name, role) VALUES (?,?,?,?)', [username, hash, name, 'admin']);
    console.log('Admin created:', username);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

run();
