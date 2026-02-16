/**
 * CLI script: migrate Excel to MySQL.
 * Usage: npm run migrate-excel -- file=./data/clients.xlsx
 *
 * This is a starter script: adjust mappings to fit your Excel columns.
 */
import XLSX from 'xlsx';
import pool from '../src/config/db.js';
import dotenv from 'dotenv';
dotenv.config();

const argv = Object.fromEntries(process.argv.slice(2).map(s => s.split('=')));
const file = argv.file || './data/clients.xlsx';

const workbook = XLSX.readFile(file);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet);

const run = async () => {
  try {
    for (const r of rows) {
      // adjust keys according to your excel columns
      const name = r['Name'] || r['Full Name'] || '';
      const phone = r['Phone'] || '';
      const email = r['Email'] || '';
      const address = r['Address'] || '';
      // basic dedupe: by phone or email
      const [existing] = await pool.query('SELECT * FROM clients WHERE phone=? OR email=?', [phone, email]);
      if (existing.length) {
        console.log('Skipping existing:', name);
        continue;
      }
      await pool.query('INSERT INTO clients (name, phone, email, address) VALUES (?,?,?,?)', [name, phone, email, address]);
      console.log('Inserted:', name);
    }
    console.log('Migration complete');
    process.exit(0);
  } catch (e) {
    console.error('Migration failed', e);
    process.exit(1);
  }
};

run();
