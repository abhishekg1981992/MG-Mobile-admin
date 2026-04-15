import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';

// ---------------------------------------------------------------------------
// Guard: if Cloudinary env vars are missing, return a middleware that rejects
// upload requests immediately with a clear 503 instead of crashing the process
// with an unhandled error thrown deep inside multer-storage-cloudinary.
// ---------------------------------------------------------------------------
const cloudinaryUnavailable = (_req, res) => {
  res.status(503).json({
    error: 'File upload unavailable',
    message:
      'Cloudinary is not configured on this server. ' +
      'Contact an administrator to set CLOUDINARY_CLOUD_NAME, ' +
      'CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
  });
};

// Wrap the unavailable handler so it can be used anywhere multer middleware is
// expected (single / array / fields call patterns all go through next()).
const disabledUpload = {
  single: () => cloudinaryUnavailable,
  array: () => cloudinaryUnavailable,
  fields: () => cloudinaryUnavailable,
};

let upload;
let uploadClaims;

if (isCloudinaryConfigured) {
  const clientStorage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'mg-insurance/clients',
      resource_type: 'auto',
      use_filename: true,
      unique_filename: true,
    },
  });

  const claimsStorage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'mg-insurance/claims',
      resource_type: 'auto',
      use_filename: true,
      unique_filename: true,
    },
  });

  upload = multer({ storage: clientStorage });
  uploadClaims = multer({ storage: claimsStorage });
} else {
  upload = disabledUpload;
  uploadClaims = disabledUpload;
}

export { upload, uploadClaims };
export default upload;
