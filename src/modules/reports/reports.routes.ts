import { Router } from 'express';
import { reportsController } from './reports.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { ownerOnly } from '../../middleware/role.middleware';

const router = Router();

router.use(authMiddleware, ownerOnly);

// تقارير PDF/Excel
router.get('/financial', reportsController.getFinancialReport);
router.get('/properties', reportsController.getPropertiesReport);
router.get('/tenants', reportsController.getTenantsReport);

export default router;
