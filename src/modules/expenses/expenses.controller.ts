import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { successResponse, paginatedResponse, errorResponse } from '../../utils/errorResponse';
import { expensesService } from './expenses.service';

export class ExpensesController {
    create = asyncHandler(async (req: Request, res: Response) => {
        try {
            const expense = await expensesService.create(req.user!.id, req.user!.id, req.body);
            res.status(201).json(successResponse('تم إضافة المصروف بنجاح', expense));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    getAll = asyncHandler(async (req: Request, res: Response) => {
        try {
            const result = await expensesService.getAll(req.user!.id, req.query as any);
            res.status(200).json(
                paginatedResponse('تم جلب المصروفات', result.expenses, result.page, result.limit, result.total)
            );
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    getById = asyncHandler(async (req: Request, res: Response) => {
        try {
            const expense = await expensesService.getById(req.user!.id, Number(req.params.id));
            res.status(200).json(successResponse('تم جلب بيانات المصروف', expense));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    update = asyncHandler(async (req: Request, res: Response) => {
        try {
            const expense = await expensesService.update(req.user!.id, Number(req.params.id), req.body);
            res.status(200).json(successResponse('تم تعديل المصروف بنجاح', expense));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    delete = asyncHandler(async (req: Request, res: Response) => {
        try {
            const result = await expensesService.delete(req.user!.id, Number(req.params.id));
            res.status(200).json(successResponse(result.message, null));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    getStats = asyncHandler(async (req: Request, res: Response) => {
        try {
            const { year, month } = req.query;
            const stats = await expensesService.getStats(
                req.user!.id,
                year ? Number(year) : undefined,
                month ? Number(month) : undefined
            );
            res.status(200).json(successResponse('تم جلب إحصائيات المصروفات', stats));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });
}

export const expensesController = new ExpensesController();
