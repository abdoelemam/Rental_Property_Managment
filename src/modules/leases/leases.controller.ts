import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { successResponse, errorResponse } from '../../utils/errorResponse';
import { leasesService } from './leases.service';
import { LeaseStatus } from '../../DB/models';

export class LeasesController {
    create = asyncHandler(async (req: Request, res: Response) => {
        try {
            const lease = await leasesService.create(req.user!.id, req.body);
            res.status(201).json(successResponse('تم إنشاء العقد بنجاح', lease));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    getAll = asyncHandler(async (req: Request, res: Response) => {
        try {
            const status = req.query.status as LeaseStatus | undefined;
            const leases = await leasesService.getAll(req.user!.id, status);
            res.status(200).json(successResponse('تم جلب العقود', leases));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    getById = asyncHandler(async (req: Request, res: Response) => {
        try {
            const lease = await leasesService.getById(req.user!.id, Number(req.params.id));
            res.status(200).json(successResponse('تم جلب بيانات العقد', lease));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    update = asyncHandler(async (req: Request, res: Response) => {
        try {
            const lease = await leasesService.update(req.user!.id, Number(req.params.id), req.body);
            res.status(200).json(successResponse('تم تعديل العقد بنجاح', lease));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    terminate = asyncHandler(async (req: Request, res: Response) => {
        try {
            const result = await leasesService.terminate(req.user!.id, Number(req.params.id));
            res.status(200).json(successResponse(result.message, null));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    renew = asyncHandler(async (req: Request, res: Response) => {
        try {
            const { newEndDate, newRent } = req.body;
            const lease = await leasesService.renew(req.user!.id, Number(req.params.id), newEndDate, newRent);
            res.status(200).json(successResponse('تم تجديد العقد بنجاح', lease));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    getExpiring = asyncHandler(async (req: Request, res: Response) => {
        try {
            const leases = await leasesService.getExpiringLeases(req.user!.id);
            res.status(200).json(successResponse('العقود المنتهية قريباً', leases));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });
}

export const leasesController = new LeasesController();
