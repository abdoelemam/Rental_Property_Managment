import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../DB/models';
import { errorResponse } from '../utils/errorResponse';

interface JwtPayload {
    id: number;
    email: string;
    role: string;
}

export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json(errorResponse('غير مصرح - Token مطلوب', 401));
            return;
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            res.status(401).json(errorResponse('غير مصرح - Token غير صالح', 401));
            return;
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'your-secret-key'
        ) as JwtPayload;

        const user = await User.findByPk(decoded.id);

        if (!user || !user.isActive) {
            res.status(401).json(errorResponse('المستخدم غير موجود أو غير نشط', 401));
            return;
        }

        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
        };

        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json(errorResponse('Token غير صالح', 401));
            return;
        }
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json(errorResponse('Token منتهي الصلاحية', 401));
            return;
        }
        res.status(500).json(errorResponse('خطأ في الخادم', 500));
    }
};
