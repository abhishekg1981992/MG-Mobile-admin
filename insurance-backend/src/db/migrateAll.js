import { createConnection } from 'mysql2/promise';
import { readFileSync, existsSync } from 'fs';
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

function isIgnorableError(err) {
  const code = err?.code || '';
  return code === 'ER_DUP_FIELDNAME' || code === 'ER_TABLE_EXISTS_ERROR' || code === 'ER_DUP_KEYNAME';
}

async function runSqlFile(connection, filePath, label) {
  console.log(`📋 Running ${label}...`);
  const sql = readFileSync(filePath, 'utf8');
  const statements = parseSqlStatements(sql);

  if (statements.length === 0) {
    console.log('  (empty — nothing to run)');
    return;
  }

  for (const statement of statements) {
    try {
      await connection.query(statement);
      console.log('  ✓ OK');
    } catch (err) {
      if (isIgnorableError(err)) {
        console.log(`  ↷ Skipped (${err.code})`);
      } else {
        console.error(`  ✗ ${err.message}`);
        throw err;
      }
    }
  }
}

export async function runAllMigrations(options = {}) {
  const mode = options.mode === 'full' ? 'full' : 'update';
  let connection;
  try {
    console.log(`🔄 Running database migrations (${mode})...\n`);

    connection = await createConnection({
      host: process.env.DB_HOST || process.env.MYSQLHOST,
      port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306'),
      user: process.env.DB_USER || process.env.MYSQLUSER,
      password: process.env.DB_PASS || process.env.MYSQLPASSWORD,
      database: process.env.DB_NAME || process.env.MYSQLDATABASE,
      multipleStatements: true,
    });

    // Full mode: run schema.sql (creates all tables from scratch)
    if (mode === 'full') {
      await runSqlFile(connection, path.join(sqlDir, 'schema.sql'), 'schema.sql');
    }

    // Both modes: run db_update.sql (incremental changes for existing DBs)
    const updatePath = path.join(sqlDir, 'db_update.sql');
    if (existsSync(updatePath)) {
      await runSqlFile(connection, updatePath, 'db_update.sql');
    } else {
      console.log('📋 No db_update.sql found — nothing to update.');
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
