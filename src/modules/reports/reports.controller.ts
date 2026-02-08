import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { successResponse, errorResponse } from '../../utils/errorResponse';
import { reportsService } from './reports.service';

export class ReportsController {
    // تقرير مالي
    getFinancialReport = asyncHandler(async (req: Request, res: Response) => {
        try {
            const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();
            const month = req.query.month ? Number(req.query.month) : new Date().getMonth() + 1;
            const format = (req.query.format as 'pdf' | 'excel') || 'pdf';

            await reportsService.generateFinancialReport(req.user!.id, year, month, format, res);
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    // تقرير العقارات
    getPropertiesReport = asyncHandler(async (req: Request, res: Response) => {
        try {
            const format = (req.query.format as 'pdf' | 'excel') || 'pdf';
            await reportsService.generatePropertiesReport(req.user!.id, format, res);
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    // تقرير المستأجرين
    getTenantsReport = asyncHandler(async (req: Request, res: Response) => {
        try {
            const format = (req.query.format as 'pdf' | 'excel') || 'pdf';
            await reportsService.generateTenantsReport(req.user!.id, format, res);
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });
}

export const reportsController = new ReportsController();
