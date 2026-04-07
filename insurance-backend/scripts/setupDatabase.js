// Setup database on Railway or any MySQL instance
// Run: node scripts/setupDatabase.js
// Runs full migration (schema.sql + all updates) then seeds admin user.

import { runAllMigrations } from '../src/db/migrateAll.js';

const setupDatabase = async () => {
  try {
    console.log('🔄 Setting up database...\n');

    // Step 1: Run full migration (schema.sql + all db_update_*.sql)
    await runAllMigrations({ mode: 'full' });

    // Step 2: Seed admin user (uses SEED_ADMIN_USER / SEED_ADMIN_PASS env vars)
    console.log('\n👤 Seeding admin user...');
    await import('./seedAdmin.js');

    console.log('\n✨ Setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
};

setupDatabase();
