import { Router } from 'express';
import auth from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { createPolicy, getPolicies, getPolicyById, updatePolicy, deletePolicy, getAllPoliciesWithDetails } from '../controllers/policies.controller.js';

const router = Router();
router.post('/', auth, requireRole('staff'), createPolicy);
router.get('/all-with-details', auth, getAllPoliciesWithDetails);
router.get('/', auth, getPolicies);
router.get('/:id', auth, getPolicyById);
router.put('/:id', auth, requireRole('staff'), updatePolicy);
router.delete('/:id', auth, requireRole('admin'), deletePolicy);

export default router;
