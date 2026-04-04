import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql');

export async function runMigrations() {
  let connection;
  try {
    console.log('🔄 Running database migrations...');

    connection = await createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      multipleStatements: true,
    });

    const sql = readFileSync(schemaPath, 'utf8');

    // Strip comments and split into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    const created = [];
    const failed = [];

    for (const statement of statements) {
      // Extract table name from CREATE TABLE [IF NOT EXISTS] <name>
      const match = statement.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?/i);
      const tableName = match ? match[1] : '(unknown)';

      console.log(`  ⏳ Creating table: ${tableName}`);
      try {
        await connection.query(statement);
        console.log(`  ✓ Created table: ${tableName}`);
        created.push(tableName);
      } catch (err) {
        console.error(`  ✗ Failed table: ${tableName} (${err.message})`);
        failed.push({ tableName, error: err.message });
      }
    }

    console.log('');
    console.log(`✅ Database migrations completed — ${created.length} created, ${failed.length} failed`);

    if (failed.length > 0) {
      console.error('❌ The following tables failed to create:');
      for (const { tableName, error } of failed) {
        console.error(`   • ${tableName}: ${error}`);
      }
      throw new Error(`Migration completed with ${failed.length} failure(s): ${failed.map(f => f.tableName).join(', ')}`);
    }
  } catch (error) {
    if (!error.message.startsWith('Migration completed with')) {
      console.error('❌ Database migration failed:', error.message);
    }
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
