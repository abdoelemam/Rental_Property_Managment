import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { allRoles } from '../../middleware/role.middleware';

const router = Router();

router.use(authMiddleware, allRoles);

// الإحصائيات الأساسية
router.get('/overview', dashboardController.getOverview);
router.get('/financial', dashboardController.getFinancialStats);
router.get('/monthly-revenue', dashboardController.getMonthlyRevenue);
router.get('/top-properties', dashboardController.getTopProperties);
router.get('/ai-analysis', dashboardController.getAIAnalysis);

// 🆕 الإحصائيات الجديدة
router.get('/revenue-per-property', dashboardController.getRevenuePerProperty);
router.get('/expenses-breakdown', dashboardController.getExpensesBreakdown);
router.get('/expiring-leases', dashboardController.getExpiringLeases);
router.get('/overdue-invoices', dashboardController.getOverdueInvoices);
router.get('/recent-activity', dashboardController.getRecentActivity);

export default router;
