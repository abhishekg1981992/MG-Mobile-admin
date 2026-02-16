import { Router } from 'express';
import auth from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import multer from 'multer';
import { createClaim, listClaims, getClaimById, updateClaim } from '../controllers/claims.controller.js';
const upload = multer({ dest: 'uploads/claims/' });

const router = Router();
router.post('/', auth, requireRole('staff'), upload.array('documents', 5), createClaim);
router.get('/', auth, listClaims);
router.get('/:id', auth, getClaimById);
router.put('/:id', auth, requireRole('staff'), upload.array('documents', 5), updateClaim);

export default router;
