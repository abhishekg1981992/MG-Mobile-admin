import { createConnection } from 'mysql2/promise';
import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sqlDir = path.join(__dirname, '..', 'sql');

export async function runAllMigrations() {
  let connection;
  try {
    console.log('🔄 Running all database migrations...');

    connection = await createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      multipleStatements: true,
    });

    // 1. Run schema.sql first (creates all tables if not exist)
    console.log('📋 Running schema.sql...');
    const schemaPath = path.join(sqlDir, 'schema.sql');
    const schemaSql = readFileSync(schemaPath, 'utf8');
    const schemaStatements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of schemaStatements) {
      const match = statement.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?/i);
      const tableName = match ? match[1] : '(unknown)';
      try {
        await connection.query(statement);
        console.log(`  ✓ ${tableName}`);
      } catch (err) {
        console.error(`  ✗ ${tableName} (${err.message})`);
      }
    }

    // 2. Run numbered migration files in order (001-*.sql, 002-*.sql, etc.)
    console.log('📝 Running migration files...');
    const files = readdirSync(sqlDir)
      .filter(f => /^\d{3}-.*\.sql$/.test(f))
      .sort();

    if (files.length === 0) {
      console.log('  (no migration files found)');
    } else {
      for (const file of files) {
        console.log(`  ⏳ ${file}`);
        const filePath = path.join(sqlDir, file);
        const sql = readFileSync(filePath, 'utf8');
        const statements = sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
          try {
            await connection.query(statement);
          } catch (err) {
            console.error(`    ✗ Error: ${err.message}`);
            throw err;
          }
        }
        console.log(`  ✓ ${file}`);
      }
    }

    console.log('\n✅ All migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
