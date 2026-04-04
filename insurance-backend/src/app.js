import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcrypt';
import pool from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import clientsRoutes from './routes/clients.routes.js';
import policiesRoutes from './routes/policies.routes.js';
import renewalsRoutes from './routes/renewals.routes.js';
import paymentsRoutes from './routes/payments.routes.js';
import claimsRoutes from './routes/claims.routes.js';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { scheduleRenewalJob } from './utils/cronJobs.js';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

// Auto-seed admin user on startup
const seedAdminUser = async () => {
  try {
    const username = process.env.SEED_ADMIN_USER || 'admin';
    const password = process.env.SEED_ADMIN_PASS || 'Admin@123';
    const name = process.env.SEED_ADMIN_NAME || 'Super Admin';
    
    const [rows] = await pool.query('SELECT * FROM admins WHERE username=?', [username]);
    if (rows.length === 0) {
      const hash = await bcrypt.hash(password, 10);
      await pool.query('INSERT INTO admins (username, password, name, role) VALUES (?,?,?,?)', 
        [username, hash, name, 'admin']);
      console.log('✅ Admin user created:', username);
    } else {
      console.log('✓ Admin user already exists');
    }
  } catch (error) {
    console.error('⚠️ Failed to seed admin user:', error.message);
  }
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Basic rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200 // limit each IP
});
app.use(limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/policies', policiesRoutes);
app.use('/api/renewals', renewalsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/claims', claimsRoutes);

// Swagger (yaml)
try {
  const swaggerPath = path.join(__dirname, 'docs', 'swagger.yaml');
  const swaggerDocument = YAML.load(swaggerPath);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (e) {
  console.warn('Swagger docs not available:', e.message);
}

app.get('/', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV || 'dev' }));

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  // Seed admin user on startup
  await seedAdminUser();
  // start any scheduled jobs
  scheduleRenewalJob();
});
