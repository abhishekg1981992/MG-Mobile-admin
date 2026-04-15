import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

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

export const upload = multer({ storage: clientStorage });
export const uploadClaims = multer({ storage: claimsStorage });

export default upload;
