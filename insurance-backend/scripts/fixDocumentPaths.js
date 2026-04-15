import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

async function fixPaths() {
  const [rows] = await pool.query('SELECT id, path FROM documents WHERE path IS NOT NULL');
  let fixed = 0;
  for (const row of rows) {
    // Normalise: strip leading slash, strip /app/ prefix, convert backslashes
    let clean = row.path.replace(/\\/g, '/').replace(/^\/?app\//, '');
    // Ensure it starts with uploads/ (no leading slash)
    if (clean.startsWith('/')) clean = clean.slice(1);
    if (clean !== row.path) {
      await pool.query('UPDATE documents SET path = ? WHERE id = ?', [clean, row.id]);
      console.log(`  ${row.id}: ${row.path}  →  ${clean}`);
      fixed++;
    }
  }
  console.log(`\nDone. Fixed ${fixed} of ${rows.length} document paths.`);
  await pool.end();
}

fixPaths().catch(err => { console.error(err); process.exit(1); });
