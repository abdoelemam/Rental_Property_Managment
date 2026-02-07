import { Router } from 'express';
import { tenantsController } from './tenants.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { ownerOrAccountant, allRoles } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createTenantSchema, updateTenantSchema, idParamSchema } from './tenants.validation';

const router = Router();

router.use(authMiddleware);

// Owner و Accountant يقدروا يضيفوا ويعدلوا
router.post('/', ownerOrAccountant, validate(createTenantSchema), tenantsController.create);
router.patch('/:id', ownerOrAccountant, validate(idParamSchema, 'params'), validate(updateTenantSchema), tenantsController.update);
router.delete('/:id', ownerOrAccountant, validate(idParamSchema, 'params'), tenantsController.delete);
router.patch('/:id/toggle-status', ownerOrAccountant, validate(idParamSchema, 'params'), tenantsController.toggleStatus);

// الكل يقدر يشوف
router.get('/', allRoles, tenantsController.getAll);
router.get('/:id', allRoles, validate(idParamSchema, 'params'), tenantsController.getById);

export default router;
