import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { successResponse, errorResponse } from '../../utils/errorResponse';
import { dashboardService } from './dashboard.service';

export class DashboardController {
    getOverview = asyncHandler(async (req: Request, res: Response) => {
        try {
            const stats = await dashboardService.getOverview(req.user!.id);
            res.status(200).json(successResponse('تم جلب الإحصائيات العامة', stats));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    getFinancialStats = asyncHandler(async (req: Request, res: Response) => {
        try {
            const year = req.query.year ? Number(req.query.year) : undefined;
            const month = req.query.month ? Number(req.query.month) : undefined;
            const stats = await dashboardService.getFinancialStats(req.user!.id, year, month);
            res.status(200).json(successResponse('تم جلب الإحصائيات المالية', stats));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    getMonthlyRevenue = asyncHandler(async (req: Request, res: Response) => {
        try {
            const revenue = await dashboardService.getMonthlyRevenue(req.user!.id);
            res.status(200).json(successResponse('تم جلب الإيرادات الشهرية', revenue));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    getTopProperties = asyncHandler(async (req: Request, res: Response) => {
        try {
            const limit = req.query.limit ? Number(req.query.limit) : 5;
            const properties = await dashboardService.getTopProperties(req.user!.id, limit);
            res.status(200).json(successResponse('أعلى العقارات أداءً', properties));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    getAIAnalysis = asyncHandler(async (req: Request, res: Response) => {
        try {
            const analysis = await dashboardService.getAIAnalysis(req.user!.id);
            res.status(200).json(successResponse('تحليل الذكاء الاصطناعي', analysis));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    // 🆕 Endpoints الجديدة
    getRevenuePerProperty = asyncHandler(async (req: Request, res: Response) => {
        try {
            const year = req.query.year ? Number(req.query.year) : undefined;
            const month = req.query.month ? Number(req.query.month) : undefined;
            const data = await dashboardService.getRevenuePerProperty(req.user!.id, year, month);
            res.status(200).json(successResponse('إيرادات كل عقار', data));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    getExpensesBreakdown = asyncHandler(async (req: Request, res: Response) => {
        try {
            const year = req.query.year ? Number(req.query.year) : undefined;
            const month = req.query.month ? Number(req.query.month) : undefined;
            const data = await dashboardService.getExpensesBreakdown(req.user!.id, year, month);
            res.status(200).json(successResponse('توزيع المصروفات', data));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    getExpiringLeases = asyncHandler(async (req: Request, res: Response) => {
        try {
            const days = req.query.days ? Number(req.query.days) : 30;
            const data = await dashboardService.getExpiringLeases(req.user!.id, days);
            res.status(200).json(successResponse('العقود المقاربة على الانتهاء', data));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    getOverdueInvoices = asyncHandler(async (req: Request, res: Response) => {
        try {
            const data = await dashboardService.getOverdueInvoices(req.user!.id);
            res.status(200).json(successResponse('الفواتير المتأخرة', data));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    getRecentActivity = asyncHandler(async (req: Request, res: Response) => {
        try {
            const limit = req.query.limit ? Number(req.query.limit) : 10;
            const data = await dashboardService.getRecentActivity(req.user!.id, limit);
            res.status(200).json(successResponse('النشاط الأخير', data));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });
}

export const dashboardController = new DashboardController();
