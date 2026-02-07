import { Router } from 'express';
import { leasesController } from './leases.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { ownerOrAccountant, allRoles } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createLeaseSchema, updateLeaseSchema, idParamSchema } from './leases.validation';

const router = Router();

router.use(authMiddleware);

// CRUD
router.post('/', ownerOrAccountant, validate(createLeaseSchema), leasesController.create);
router.get('/', allRoles, leasesController.getAll);
router.get('/expiring', allRoles, leasesController.getExpiring);
router.get('/:id', allRoles, validate(idParamSchema, 'params'), leasesController.getById);
router.patch('/:id', ownerOrAccountant, validate(idParamSchema, 'params'), validate(updateLeaseSchema), leasesController.update);
router.post('/:id/terminate', ownerOrAccountant, validate(idParamSchema, 'params'), leasesController.terminate);
router.post('/:id/renew', ownerOrAccountant, validate(idParamSchema, 'params'), leasesController.renew);

export default router;
