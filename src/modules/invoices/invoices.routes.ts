import { Router } from 'express';
import { invoicesController } from './invoices.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { ownerOrAccountant, allRoles } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createInvoiceSchema, updateInvoiceSchema, createPaymentSchema, idParamSchema, querySchema } from './invoices.validation';

const router = Router();

router.use(authMiddleware);

// Invoices
router.post('/', ownerOrAccountant, validate(createInvoiceSchema), invoicesController.create);
router.get('/', allRoles, validate(querySchema, 'query'), invoicesController.getAll);
router.get('/overdue', allRoles, invoicesController.getOverdue);
router.get('/:id', allRoles, validate(idParamSchema, 'params'), invoicesController.getById);
router.patch('/:id', ownerOrAccountant, validate(idParamSchema, 'params'), validate(updateInvoiceSchema), invoicesController.update);
router.post('/:id/cancel', ownerOrAccountant, validate(idParamSchema, 'params'), invoicesController.cancel);

// Payments
router.post('/payments', ownerOrAccountant, validate(createPaymentSchema), invoicesController.addPayment);
router.get('/:id/payments', allRoles, validate(idParamSchema, 'params'), invoicesController.getPayments);

export default router;
