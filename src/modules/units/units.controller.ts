import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { successResponse, errorResponse } from '../../utils/errorResponse';
import { unitsService } from './units.service';

export class UnitsController {
    create = asyncHandler(async (req: Request, res: Response) => {
        try {
            const unit = await unitsService.create(req.user!.id, req.body);
            res.status(201).json(successResponse('تم إنشاء الوحدة بنجاح', unit));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    getByPropertyId = asyncHandler(async (req: Request, res: Response) => {
        try {
            const units = await unitsService.getByPropertyId(req.user!.id, Number(req.params.propertyId));
            res.status(200).json(successResponse('تم جلب الوحدات', units));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    getById = asyncHandler(async (req: Request, res: Response) => {
        try {
            const unit = await unitsService.getById(req.user!.id, Number(req.params.id));
            res.status(200).json(successResponse('تم جلب بيانات الوحدة', unit));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    update = asyncHandler(async (req: Request, res: Response) => {
        try {
            const unit = await unitsService.update(req.user!.id, Number(req.params.id), req.body);
            res.status(200).json(successResponse('تم تعديل الوحدة بنجاح', unit));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    delete = asyncHandler(async (req: Request, res: Response) => {
        try {
            const result = await unitsService.delete(req.user!.id, Number(req.params.id));
            res.status(200).json(successResponse(result.message, null));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    restore = asyncHandler(async (req: Request, res: Response) => {
        try {
            const result = await unitsService.restore(req.user!.id, Number(req.params.id));
            res.status(200).json(successResponse(result.message, result.unit));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    updateStatus = asyncHandler(async (req: Request, res: Response) => {
        try {
            const result = await unitsService.updateStatus(
                req.user!.id,
                Number(req.params.id),
                req.body.status
            );
            res.status(200).json(successResponse(result.message, result));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    getVacant = asyncHandler(async (req: Request, res: Response) => {
        try {
            const propertyId = req.query.propertyId ? Number(req.query.propertyId) : undefined;
            const units = await unitsService.getVacantUnits(req.user!.id, propertyId);
            res.status(200).json(successResponse('تم جلب الوحدات الفارغة', units));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });
}

export const unitsController = new UnitsController();
