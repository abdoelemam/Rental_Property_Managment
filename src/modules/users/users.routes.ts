import { Router } from 'express';
import { usersController } from './users.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { ownerOnly } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createUserSchema, updateUserSchema, idParamSchema } from './users.validation';

const router = Router();

// جميع الـ routes تتطلب Owner فقط
router.use(authMiddleware, ownerOnly);

router.post('/', validate(createUserSchema), usersController.create);
router.get('/', usersController.getAll);
router.get('/:id', validate(idParamSchema, 'params'), usersController.getById);
router.patch('/:id', validate(idParamSchema, 'params'), validate(updateUserSchema), usersController.update);
router.delete('/:id', validate(idParamSchema, 'params'), usersController.delete);
router.patch('/:id/toggle-status', validate(idParamSchema, 'params'), usersController.toggleStatus);

export default router;
