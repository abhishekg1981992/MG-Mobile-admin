// Setup database on Railway or any MySQL instance
// Run: node scripts/setupDatabase.js

import pool from '../src/config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const setupDatabase = async () => {
  try {
    console.log('🔄 Setting up database...');

    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'src', 'sql', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split by semicolon and execute each statement
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    let count = 0;
    for (const statement of statements) {
      try {
        await pool.query(statement);
        count++;
        console.log(`✅ Executed statement ${count}`);
      } catch (err) {
        // Table might already exist - that's ok
        if (err.code !== 'ER_TABLE_EXISTS_ERROR' && err.code !== 'ER_DB_CREATE_EXISTS') {
          console.warn(`⚠️ Statement ${count} warning:`, err.message);
        }
      }
    }

    console.log(`🎉 Database setup complete! Created/updated ${count} statements`);

    // Try to seed admin user
    console.log('👤 Creating admin user...');
    const bcrypt = (await import('bcrypt')).default;
    
    const username = 'admin';
    const password = 'Admin@123';
    const name = 'Super Admin';
    
    const [rows] = await pool.query('SELECT * FROM admins WHERE username=?', [username]);
    if (rows.length === 0) {
      const hash = await bcrypt.hash(password, 10);
      await pool.query('INSERT INTO admins (username, password, name, role) VALUES (?,?,?,?)', 
        [username, hash, name, 'admin']);
      console.log('✅ Admin user created');
    } else {
      console.log('✓ Admin user already exists');
    }

    console.log('\n✨ Setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error(error);
    process.exit(1);
  }
};

setupDatabase();
