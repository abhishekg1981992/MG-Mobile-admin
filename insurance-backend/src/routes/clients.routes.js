import { Router } from 'express';
import auth from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { 
  createClient, 
  getClients, 
  getClientById, 
  updateClient, 
  deleteClient, 
  uploadClientDocument,
  importPoliciesFromExcel,
  exportClientsAndPolicies
} from '../controllers/clients.controller.js';
import upload from '../middleware/upload.js';

const router = Router();

// Standard CRUD operations
router.post('/', auth, requireRole('staff'), createClient);
router.get('/', auth, getClients);
router.get('/:id', auth, getClientById);
router.put('/:id', auth, requireRole('staff'), updateClient);
router.delete('/:id', auth, requireRole('admin'), deleteClient);
router.post('/:id/doc', auth, requireRole('staff'), upload.single('file'), uploadClientDocument);

// Excel import/export operations
router.post('/import-excel', auth, requireRole('staff'), upload.single('file'), importPoliciesFromExcel);
router.get('/export', auth, requireRole('staff'), exportClientsAndPolicies);

export default router;
