import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { successResponse, paginatedResponse, errorResponse } from '../../utils/errorResponse';
import { tenantsService } from './tenants.service';

export class TenantsController {
    create = asyncHandler(async (req: Request, res: Response) => {
        try {
            const tenant = await tenantsService.create(req.user!.id, req.body);
            res.status(201).json(successResponse('تم إنشاء المستأجر بنجاح', tenant));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    getAll = asyncHandler(async (req: Request, res: Response) => {
        try {
            const result = await tenantsService.getAll(req.user!.id, req.query as any);
            res.status(200).json(
                paginatedResponse('تم جلب المستأجرين', result.tenants, result.page, result.limit, result.total)
            );
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    getById = asyncHandler(async (req: Request, res: Response) => {
        try {
            const tenant = await tenantsService.getById(req.user!.id, Number(req.params.id));
            res.status(200).json(successResponse('تم جلب بيانات المستأجر', tenant));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    update = asyncHandler(async (req: Request, res: Response) => {
        try {
            const tenant = await tenantsService.update(req.user!.id, Number(req.params.id), req.body);
            res.status(200).json(successResponse('تم تعديل المستأجر بنجاح', tenant));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    delete = asyncHandler(async (req: Request, res: Response) => {
        try {
            const result = await tenantsService.delete(req.user!.id, Number(req.params.id));
            res.status(200).json(successResponse(result.message, null));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    toggleStatus = asyncHandler(async (req: Request, res: Response) => {
        try {
            const result = await tenantsService.toggleStatus(req.user!.id, Number(req.params.id));
            res.status(200).json(successResponse(result.message, result));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });
}

export const tenantsController = new TenantsController();
