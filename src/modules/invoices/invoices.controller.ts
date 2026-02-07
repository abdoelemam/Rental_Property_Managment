import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { successResponse, paginatedResponse, errorResponse } from '../../utils/errorResponse';
import { invoicesService } from './invoices.service';

export class InvoicesController {
    // === Invoices ===
    create = asyncHandler(async (req: Request, res: Response) => {
        try {
            const invoice = await invoicesService.create(req.user!.id, req.body);
            res.status(201).json(successResponse('تم إنشاء الفاتورة بنجاح', invoice));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    getAll = asyncHandler(async (req: Request, res: Response) => {
        try {
            const result = await invoicesService.getAll(req.user!.id, req.query as any);
            res.status(200).json(
                paginatedResponse('تم جلب الفواتير', result.invoices, result.page, result.limit, result.total)
            );
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    getById = asyncHandler(async (req: Request, res: Response) => {
        try {
            const invoice = await invoicesService.getById(req.user!.id, Number(req.params.id));
            res.status(200).json(successResponse('تم جلب بيانات الفاتورة', invoice));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    update = asyncHandler(async (req: Request, res: Response) => {
        try {
            const invoice = await invoicesService.update(req.user!.id, Number(req.params.id), req.body);
            res.status(200).json(successResponse('تم تعديل الفاتورة بنجاح', invoice));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    cancel = asyncHandler(async (req: Request, res: Response) => {
        try {
            const result = await invoicesService.cancel(req.user!.id, Number(req.params.id));
            res.status(200).json(successResponse(result.message, null));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    getOverdue = asyncHandler(async (req: Request, res: Response) => {
        try {
            const invoices = await invoicesService.getOverdueInvoices(req.user!.id);
            res.status(200).json(successResponse('الفواتير المتأخرة', invoices));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    // === Payments ===
    addPayment = asyncHandler(async (req: Request, res: Response) => {
        try {
            const payment = await invoicesService.addPayment(req.user!.id, req.user!.id, req.body);
            res.status(201).json(successResponse('تم إضافة الدفعة بنجاح', payment));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    getPayments = asyncHandler(async (req: Request, res: Response) => {
        try {
            const payments = await invoicesService.getPaymentsByInvoice(req.user!.id, Number(req.params.id));
            res.status(200).json(successResponse('تم جلب المدفوعات', payments));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });
}

export const invoicesController = new InvoicesController();
