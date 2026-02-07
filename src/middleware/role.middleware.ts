import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../DB/models';
import { errorResponse } from '../utils/errorResponse';

export const roleMiddleware = (...allowedRoles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json(errorResponse('غير مصرح - يجب تسجيل الدخول أولاً', 401));
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json(
                errorResponse(
                    `غير مسموح - هذا الإجراء يتطلب صلاحية: ${allowedRoles.join(' أو ')}`,
                    403
                )
            );
            return;
        }

        next();
    };
};

// Shortcuts للصلاحيات الشائعة
export const adminOnly = roleMiddleware(UserRole.ADMIN);
export const ownerOnly = roleMiddleware(UserRole.OWNER);
export const adminOrOwner = roleMiddleware(UserRole.ADMIN, UserRole.OWNER);
export const ownerOrAccountant = roleMiddleware(UserRole.OWNER, UserRole.ACCOUNTANT);
export const allRoles = roleMiddleware(UserRole.ADMIN, UserRole.OWNER, UserRole.ACCOUNTANT, UserRole.VIEWER);
