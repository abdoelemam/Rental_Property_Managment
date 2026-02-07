import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { successResponse, errorResponse } from '../../utils/errorResponse';
import { authService } from './auth.service';

export class AuthController {
    // تسجيل مستخدم جديد
    register = asyncHandler(async (req: Request, res: Response) => {
        try {
            const result = await authService.register(req.body);
            res.status(201).json(successResponse('تم إنشاء الحساب بنجاح', result));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    // تسجيل الدخول
    login = asyncHandler(async (req: Request, res: Response) => {
        try {
            const result = await authService.login(req.body);
            res.status(200).json(successResponse('تم تسجيل الدخول بنجاح', result));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    // تغيير كلمة المرور
    changePassword = asyncHandler(async (req: Request, res: Response) => {
        try {
            const result = await authService.changePassword(req.user!.id, req.body);
            res.status(200).json(successResponse(result.message, null));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });

    // الحصول على بيانات المستخدم الحالي
    getMe = asyncHandler(async (req: Request, res: Response) => {
        try {
            const user = await authService.getMe(req.user!.id);
            res.status(200).json(successResponse('تم جلب البيانات بنجاح', user));
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };
            res.status(err.status || 500).json(errorResponse(err.message || 'خطأ في الخادم', err.status || 500));
        }
    });
}

export const authController = new AuthController();
