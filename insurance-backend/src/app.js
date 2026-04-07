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
import logger from './utils/logger.js';

dotenv.config();

// ---------------------------------------------------------------------------
// Process-level error guards — catch anything that slips past Express so the
// process doesn't silently die and leave Railway thinking the app is healthy.
// ---------------------------------------------------------------------------
process.on('uncaughtException', (err) => {
  logger.error('💥 Uncaught exception — process will exit', {
    message: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('💥 Unhandled promise rejection — process will exit', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
  process.exit(1);
});

// ---------------------------------------------------------------------------
// Admin seeding
// ---------------------------------------------------------------------------
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
      logger.info('✅ Admin user created', { username });
    } else {
      logger.info('✓ Admin user already exists', { username });
    }
  } catch (error) {
    logger.error('⚠️ Failed to seed admin user', { message: error.message });
  }
};

// ---------------------------------------------------------------------------
// Database connectivity check
// ---------------------------------------------------------------------------
const checkDatabaseConnection = async () => {
  try {
    logger.info('🔌 Verifying database connection...');
    const [rows] = await pool.query('SELECT 1 AS ok');
    if (rows[0]?.ok === 1) {
      logger.info('✅ Database connection verified');
    }
  } catch (error) {
    logger.error('❌ Database connection failed', {
      message: error.message,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
    });
    throw error;
  }
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';

// ---------------------------------------------------------------------------
// Core middleware
// ---------------------------------------------------------------------------
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Basic rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
});
app.use(limiter);

// ---------------------------------------------------------------------------
// Request logging — log every inbound request so we can see what's arriving
// ---------------------------------------------------------------------------
app.use((req, _res, next) => {
  logger.info('→ Incoming request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });
  next();
});

// ---------------------------------------------------------------------------
// Health check — must be registered before other routes so it is always
// reachable even if a downstream middleware throws during initialisation.
// ---------------------------------------------------------------------------
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    port: PORT,
    database: 'unknown',
  };

  try {
    await pool.query('SELECT 1');
    health.database = 'connected';
    res.status(200).json(health);
  } catch (err) {
    health.status = 'degraded';
    health.database = 'unreachable';
    health.dbError = err.message;
    logger.error('Health check: database unreachable', { message: err.message });
    res.status(503).json(health);
  }
});

// ---------------------------------------------------------------------------
// Application routes
// ---------------------------------------------------------------------------
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
  logger.warn('Swagger docs not available', { message: e.message });
}

app.get('/', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV || 'development' }));

// ---------------------------------------------------------------------------
// 404 handler — catches requests that matched no route
// ---------------------------------------------------------------------------
app.use((req, res) => {
  logger.warn('404 Not Found', { method: req.method, url: req.originalUrl });
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

// ---------------------------------------------------------------------------
// Global Express error handler — catches errors thrown/passed in route handlers
// ---------------------------------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error('Unhandled Express error', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
  });
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
  });
});

// ---------------------------------------------------------------------------
// Startup sequence: verify DB → seed admin → listen
// ---------------------------------------------------------------------------
checkDatabaseConnection()
  .then(() => seedAdminUser())
  .then(() => {
    const server = app.listen(PORT, HOST, () => {
      const addr = server.address();
      logger.info(`🚀 Server listening`, {
        host: addr.address,
        port: addr.port,
        env: process.env.NODE_ENV || 'development',
      });
      scheduleRenewalJob();
    });

    server.on('error', (err) => {
      logger.error('❌ Server failed to bind', {
        message: err.message,
        code: err.code,
        port: PORT,
      });
      process.exit(1);
    });
  })
  .catch((err) => {
    logger.error('❌ Startup failed — shutting down', {
      message: err.message,
      stack: err.stack,
    });
    process.exit(1);
  });
