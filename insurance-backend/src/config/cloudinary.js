import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

// ---------------------------------------------------------------------------
// Validate required Cloudinary environment variables before configuring the
// SDK. Missing credentials cause multer-storage-cloudinary to throw an
// unhandled error at request time, which silently crashes the process.
// ---------------------------------------------------------------------------
const REQUIRED_VARS = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

const missingVars = REQUIRED_VARS.filter((key) => !process.env[key]);

export const isCloudinaryConfigured = missingVars.length === 0;

if (!isCloudinaryConfigured) {
  logger.warn(
    '⚠️  Cloudinary is not configured — file upload features will be disabled. ' +
    `Missing environment variable(s): ${missingVars.join(', ')}. ` +
    'Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET ' +
    'in the Railway service environment to enable uploads.',
  );
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  logger.info('✅ Cloudinary configured', {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  });
}

export default cloudinary;
