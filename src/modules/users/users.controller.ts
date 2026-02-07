import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { successResponse, errorResponse } from '../../utils/errorResponse';
import { usersService } from './users.service';

export class UsersController {
    // إضافة عضو فريق
    create = asyncHandler(async (req: Request, res: Response) => {
        try {
            const user = await usersService.createTeamMember(req.user!.id, req.body);
            res.status(201).json(successResponse('تم إضافة العضو بنجاح', user));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    // جلب أعضاء الفريق
    getAll = asyncHandler(async (req: Request, res: Response) => {
        try {
            const members = await usersService.getTeamMembers(req.user!.id);
            res.status(200).json(successResponse('تم جلب أعضاء الفريق', members));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    // جلب عضو بالـ ID
    getById = asyncHandler(async (req: Request, res: Response) => {
        try {
            const member = await usersService.getTeamMemberById(req.user!.id, Number(req.params.id));
            res.status(200).json(successResponse('تم جلب بيانات العضو', member));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    // تعديل عضو
    update = asyncHandler(async (req: Request, res: Response) => {
        try {
            const member = await usersService.updateTeamMember(req.user!.id, Number(req.params.id), req.body);
            res.status(200).json(successResponse('تم تعديل بيانات العضو', member));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    // حذف عضو
    delete = asyncHandler(async (req: Request, res: Response) => {
        try {
            const result = await usersService.deleteTeamMember(req.user!.id, Number(req.params.id));
            res.status(200).json(successResponse(result.message, null));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    // تفعيل/إلغاء تفعيل
    toggleStatus = asyncHandler(async (req: Request, res: Response) => {
        try {
            const result = await usersService.toggleMemberStatus(req.user!.id, Number(req.params.id));
            res.status(200).json(successResponse(result.message, { id: result.id, isActive: result.isActive }));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });
}

export const usersController = new UsersController();
