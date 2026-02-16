import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes.js';
import clientsRoutes from './routes/clients.routes.js';
import policiesRoutes from './routes/policies.routes.js';
import renewalsRoutes from './routes/renewals.routes.js';
import paymentsRoutes from './routes/payments.routes.js';
import claimsRoutes from './routes/claims.routes.js';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { scheduleRenewalJob } from './utils/cronJobs.js';
dotenv.config();

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
  const swaggerDocument = YAML.load('./src/docs/swagger.yaml');
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (e) {
  console.warn('Swagger docs not available:', e.message);
}

app.get('/', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV || 'dev' }));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // start any scheduled jobs
  scheduleRenewalJob();
});
