import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { allRoles } from '../../middleware/role.middleware';

const router = Router();

router.use(authMiddleware, allRoles);

router.get('/overview', dashboardController.getOverview);
router.get('/financial', dashboardController.getFinancialStats);
router.get('/monthly-revenue', dashboardController.getMonthlyRevenue);
router.get('/top-properties', dashboardController.getTopProperties);
router.get('/ai-analysis', dashboardController.getAIAnalysis);

export default router;
