import { runAllMigrations } from '../src/db/migrateAll.js';

const modeArg = process.argv[2];
const mode = modeArg === 'full' ? 'full' : 'update';

console.log(`Running migrations in '${mode}' mode...`);

runAllMigrations({ mode })
  .then(() => {
    console.log('Migration step completed successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration step failed:', err.message);
    process.exit(1);
  });
