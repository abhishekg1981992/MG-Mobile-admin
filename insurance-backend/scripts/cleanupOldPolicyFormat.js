/**
 * Cleanup script to remove policies with old format (policy_number containing "-")
 * The old format was: "policy_number - policy_type"
 * Now we store them separately in policy_number and policy_type columns
 */

import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function cleanup() {
  try {
    console.log('Starting cleanup of old format policies...');

    // Get count of records to delete
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as count FROM policies WHERE policy_number LIKE '%-%'`
    );

    const recordsToDelete = countResult[0].count;
    console.log(`Found ${recordsToDelete} policies with old format (containing "-")`);

    if (recordsToDelete === 0) {
      console.log('No old format records found. Cleanup complete.');
      process.exit(0);
    }

    // Display sample records before deletion
    const [samples] = await pool.query(
      `SELECT id, policy_number, policy_type, provider FROM policies 
       WHERE policy_number LIKE '%-%' 
       LIMIT 5`
    );

    console.log('\nSample records to be deleted:');
    samples.forEach(record => {
      console.log(`  ID: ${record.id}, Policy#: "${record.policy_number}", Type: "${record.policy_type}", Provider: "${record.provider}"`);
    });

    // Delete old format records
    const [deleteResult] = await pool.query(
      `DELETE FROM policies WHERE policy_number LIKE '%-%'`
    );

    console.log(`\nSuccessfully deleted ${deleteResult.affectedRows} policies with old format.`);

    // Show final count
    const [finalCount] = await pool.query(
      `SELECT COUNT(*) as count FROM policies`
    );

    console.log(`Total policies remaining in database: ${finalCount[0].count}`);

    await pool.end();
    console.log('\nCleanup completed successfully.');
    process.exit(0);

  } catch (error) {
    console.error('Error during cleanup:', error.message);
    await pool.end();
    process.exit(1);
  }
}

// Run cleanup
cleanup();
