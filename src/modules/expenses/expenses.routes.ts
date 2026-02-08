import { Router } from 'express';
import { expensesController } from './expenses.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { ownerOrAccountant, allRoles } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createExpenseSchema, updateExpenseSchema, idParamSchema, querySchema } from './expenses.validation';

const router = Router();

// حماية جميع المسارات
router.use(authMiddleware);
router.use(ownerOrAccountant);

// المصروفات
router.post('/', validate(createExpenseSchema), expensesController.create);
router.get('/', validate(querySchema, 'query'), expensesController.getAll);
router.get('/stats', expensesController.getStats);
router.get('/:id', validate(idParamSchema, 'params'), expensesController.getById);
router.patch('/:id', validate(idParamSchema, 'params'), validate(updateExpenseSchema), expensesController.update);
router.delete('/:id', validate(idParamSchema, 'params'), expensesController.delete);

export default router;
