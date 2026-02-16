import { Router } from 'express';
import auth from '../middleware/authMiddleware.js';
import { createPayment, listPayments, updatePayment } from '../controllers/payments.controller.js';

const router = Router();
router.post('/', auth, createPayment);
router.get('/', auth, listPayments);
router.put('/:id', auth, updatePayment);

export default router;
