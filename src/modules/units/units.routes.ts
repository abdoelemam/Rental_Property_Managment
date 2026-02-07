import { Router } from 'express';
import { unitsController } from './units.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { ownerOrAccountant, allRoles } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createUnitSchema, updateUnitSchema, updateStatusSchema, idParamSchema, propertyIdParamSchema } from './units.validation';

const router = Router();

router.use(authMiddleware);

// CRUD
router.post('/', ownerOrAccountant, validate(createUnitSchema), unitsController.create);
router.get('/property/:propertyId', allRoles, validate(propertyIdParamSchema, 'params'), unitsController.getByPropertyId);
router.get('/vacant', allRoles, unitsController.getVacant);
router.get('/:id', allRoles, validate(idParamSchema, 'params'), unitsController.getById);
router.patch('/:id', ownerOrAccountant, validate(idParamSchema, 'params'), validate(updateUnitSchema), unitsController.update);
router.patch('/:id/status', ownerOrAccountant, validate(idParamSchema, 'params'), validate(updateStatusSchema), unitsController.updateStatus);
router.patch('/:id/restore', ownerOrAccountant, validate(idParamSchema, 'params'), unitsController.restore);
router.delete('/:id', ownerOrAccountant, validate(idParamSchema, 'params'), unitsController.delete);

export default router;
