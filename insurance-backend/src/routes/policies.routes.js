import { Router } from 'express';
import auth from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import upload from '../middleware/upload.js';
import { createPolicy, getPolicies, getPolicyById, updatePolicy, deletePolicy, getAllPoliciesWithDetails, uploadPolicyDocument } from '../controllers/policies.controller.js';

const router = Router();
router.post('/', auth, requireRole('staff'), createPolicy);
router.get('/all-with-details', auth, getAllPoliciesWithDetails);
router.get('/', auth, getPolicies);
router.get('/:id', auth, getPolicyById);
router.put('/:id', auth, requireRole('staff'), updatePolicy);
router.delete('/:id', auth, requireRole('admin'), deletePolicy);
router.post('/:id/doc', auth, requireRole('staff'), upload.single('file'), uploadPolicyDocument);

export default router;
