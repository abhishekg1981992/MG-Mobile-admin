import { createConnection } from 'mysql2/promise';
import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sqlDir = path.join(__dirname, '..', 'sql');

function parseSqlStatements(sqlText) {
  const withoutBlockComments = sqlText.replace(/\/\*[\s\S]*?\*\//g, '');
  const withoutLineComments = withoutBlockComments
    .split('\n')
    .map((line) => line.replace(/^\s*--.*$/, ''))
    .join('\n');

  return withoutLineComments
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function isIgnorableMigrationError(err) {
  const code = err?.code || '';
  return code === 'ER_DUP_FIELDNAME' || code === 'ER_TABLE_EXISTS_ERROR' || code === 'ER_DUP_KEYNAME';
}

async function ensureMigrationTable(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function wasMigrationApplied(connection, filename) {
  const [rows] = await connection.query('SELECT id FROM schema_migrations WHERE filename = ? LIMIT 1', [filename]);
  return rows.length > 0;
}

async function markMigrationApplied(connection, filename) {
  await connection.query('INSERT INTO schema_migrations (filename) VALUES (?)', [filename]);
}

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

    await ensureMigrationTable(connection);

    // 1. Run schema.sql first (creates all tables if not exist)
    console.log('📋 Running schema.sql...');
    const schemaPath = path.join(sqlDir, 'schema.sql');
    const schemaSql = readFileSync(schemaPath, 'utf8');
    const schemaStatements = parseSqlStatements(schemaSql);

    for (const statement of schemaStatements) {
      const match = statement.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?/i);
      const tableName = match ? match[1] : '(unknown)';
      try {
        await connection.query(statement);
        console.log(`  ✓ ${tableName}`);
      } catch (err) {
        if (isIgnorableMigrationError(err)) {
          console.log(`  ↷ ${tableName} (${err.code})`);
        } else {
          console.error(`  ✗ ${tableName} (${err.message})`);
          throw err;
        }
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
        const alreadyApplied = await wasMigrationApplied(connection, file);
        if (alreadyApplied) {
          console.log(`  ↷ ${file} (already applied)`);
          continue;
        }

        console.log(`  ⏳ ${file}`);
        const filePath = path.join(sqlDir, file);
        const sql = readFileSync(filePath, 'utf8');
        const statements = parseSqlStatements(sql);

        for (const statement of statements) {
          try {
            await connection.query(statement);
          } catch (err) {
            if (isIgnorableMigrationError(err)) {
              console.log(`    ↷ Skipped: ${err.code}`);
              continue;
            }
            console.error(`    ✗ Error: ${err.message}`);
            throw err;
          }
        }

        await markMigrationApplied(connection, file);
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
