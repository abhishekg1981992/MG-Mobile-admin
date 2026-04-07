import { runAllMigrations } from '../src/db/migrateAll.js';

runAllMigrations()
  .then(() => {
    console.log('Migration step completed successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration step failed:', err.message);
    process.exit(1);
  });
