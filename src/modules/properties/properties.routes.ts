import { Router } from 'express';
import { propertiesController } from './properties.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { ownerOrAccountant, allRoles } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createPropertySchema, updatePropertySchema, idParamSchema, querySchema } from './properties.validation';

const router = Router();

router.use(authMiddleware);

// Owner و Accountant يقدروا يضيفوا ويعدلوا
router.post('/', ownerOrAccountant, validate(createPropertySchema), propertiesController.create);
router.patch('/:id', ownerOrAccountant, validate(idParamSchema, 'params'), validate(updatePropertySchema), propertiesController.update);
router.delete('/:id', ownerOrAccountant, validate(idParamSchema, 'params'), propertiesController.delete);

// الكل يقدر يشوف
router.get('/', allRoles, propertiesController.getAll);
router.get('/:id', allRoles, validate(idParamSchema, 'params'), propertiesController.getById);
router.get('/:id/stats', allRoles, validate(idParamSchema, 'params'), propertiesController.getStats);

export default router;
