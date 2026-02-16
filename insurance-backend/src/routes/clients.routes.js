import { Router } from 'express';
import auth from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { createClient, getClients, getClientById, updateClient, deleteClient, uploadClientDocument } from '../controllers/clients.controller.js';
import upload from '../middleware/upload.js';

const router = Router();

router.post('/', auth, requireRole('staff'), createClient);
router.get('/', auth, getClients);
router.get('/:id', auth, getClientById);
router.put('/:id', auth, requireRole('staff'), updateClient);
router.delete('/:id', auth, requireRole('admin'), deleteClient);
router.post('/:id/doc', auth, requireRole('staff'), upload.single('file'), uploadClientDocument);

export default router;
