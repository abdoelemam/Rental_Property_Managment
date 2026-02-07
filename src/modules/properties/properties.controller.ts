import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { successResponse, paginatedResponse, errorResponse } from '../../utils/errorResponse';
import { propertiesService } from './properties.service';

export class PropertiesController {
    create = asyncHandler(async (req: Request, res: Response) => {
        try {
            const property = await propertiesService.create(req.user!.id, req.body);
            res.status(201).json(successResponse('تم إنشاء العقار بنجاح', property));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    getAll = asyncHandler(async (req: Request, res: Response) => {
        try {
            const result = await propertiesService.getAll(req.user!.id, req.query as any);
            res.status(200).json(
                paginatedResponse('تم جلب العقارات', result.properties, result.page, result.limit, result.total)
            );
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    getById = asyncHandler(async (req: Request, res: Response) => {
        try {
            const property = await propertiesService.getById(req.user!.id, Number(req.params.id));
            res.status(200).json(successResponse('تم جلب بيانات العقار', property));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    update = asyncHandler(async (req: Request, res: Response) => {
        try {
            const property = await propertiesService.update(req.user!.id, Number(req.params.id), req.body);
            res.status(200).json(successResponse('تم تعديل العقار بنجاح', property));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    delete = asyncHandler(async (req: Request, res: Response) => {
        try {
            const result = await propertiesService.delete(req.user!.id, Number(req.params.id));
            res.status(200).json(successResponse(result.message, null));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    getStats = asyncHandler(async (req: Request, res: Response) => {
        try {
            const stats = await propertiesService.getStats(req.user!.id, Number(req.params.id));
            res.status(200).json(successResponse('تم جلب إحصائيات العقار', stats));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });
}

export const propertiesController = new PropertiesController();
