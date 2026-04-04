/**
 * Cleanup script to delete all existing clients and policies
 * This is needed before re-importing with the new flexible policy_number format
 */

import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import readline from 'readline';

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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function deleteAllData() {
  try {
    // Confirmation prompt
    rl.question('⚠️  WARNING: This will delete ALL clients and policies. Are you sure? (yes/no): ', async (answer) => {
      if (answer.toLowerCase() !== 'yes') {
        console.log('❌ Operation cancelled.');
        await pool.end();
        rl.close();
        process.exit(0);
      }

      console.log('\n🗑️  Starting cleanup of all data...\n');

      // Get counts before deletion
      const [clientCount] = await pool.query('SELECT COUNT(*) as count FROM clients');
      const [policyCount] = await pool.query('SELECT COUNT(*) as count FROM policies');

      console.log(`📊 Current data:
  - Clients: ${clientCount[0].count}
  - Policies: ${policyCount[0].count}`);

      // Delete all policies first (due to foreign key constraint)
      console.log('\n🔄 Deleting policies...');
      const [policyResult] = await pool.query('DELETE FROM policies');
      console.log(`✅ Deleted ${policyResult.affectedRows} policies`);

      // Delete all clients
      console.log('\n🔄 Deleting clients...');
      const [clientResult] = await pool.query('DELETE FROM clients');
      console.log(`✅ Deleted ${clientResult.affectedRows} clients`);

      // Verify deletion
      const [finalClientCount] = await pool.query('SELECT COUNT(*) as count FROM clients');
      const [finalPolicyCount] = await pool.query('SELECT COUNT(*) as count FROM policies');

      console.log(`\n✨ Cleanup completed successfully!
📊 New data:
  - Clients: ${finalClientCount[0].count}
  - Policies: ${finalPolicyCount[0].count}

🚀 Ready for fresh import!`);

      await pool.end();
      rl.close();
      process.exit(0);

    });

  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    await pool.end();
    rl.close();
    process.exit(1);
  }
}

// Run cleanup
deleteAllData();
