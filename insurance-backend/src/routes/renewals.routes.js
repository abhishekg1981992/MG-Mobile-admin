import { Router } from 'express';
import auth from '../middleware/authMiddleware.js';
import { listRenewals, createRenewal, markRenewalComplete, getRenewalsDue } from '../controllers/renewals.controller.js';

const router = Router();
router.get('/due', auth, getRenewalsDue);
router.get('/', auth, listRenewals);
router.post('/', auth, createRenewal);
router.put('/:id/complete', auth, markRenewalComplete);

export default router;
