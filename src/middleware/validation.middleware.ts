import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError, ZodIssue } from 'zod';
import { errorResponse } from '../utils/errorResponse';

type ValidationTarget = 'body' | 'query' | 'params';

export const validate = (schema: ZodSchema, target: ValidationTarget = 'body') => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const dataToValidate = req[target];
            const result = schema.parse(dataToValidate);

            // استبدال البيانات الأصلية بالبيانات المتحققة
            if (target === 'body') {
                req.body = result;
            } else if (target === 'params') {
                Object.assign(req.params, result);
            } else if (target === 'query') {
                Object.assign(req.query, result);
            }

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const formattedErrors = error.issues.map((err: ZodIssue) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));

                res.status(400).json({
                    success: false,
                    message: 'خطأ في البيانات المدخلة',
                    errors: formattedErrors,
                });
                return;
            }

            console.error('Validation Error:', error);
            res.status(500).json(errorResponse('خطأ في التحقق من البيانات', 500));
        }
    };
};

// للتحقق من أكثر من مصدر في نفس الوقت
export const validateMultiple = (schemas: {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
}) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const allErrors: { field: string; message: string }[] = [];

            if (schemas.body) {
                try {
                    req.body = schemas.body.parse(req.body);
                } catch (error) {
                    if (error instanceof ZodError) {
                        allErrors.push(
                            ...error.issues.map((err: ZodIssue) => ({
                                field: `body.${err.path.join('.')}`,
                                message: err.message,
                            }))
                        );
                    }
                }
            }

            if (schemas.query) {
                try {
                    (req as any).query = schemas.query.parse(req.query);
                } catch (error) {
                    if (error instanceof ZodError) {
                        allErrors.push(
                            ...error.issues.map((err: ZodIssue) => ({
                                field: `query.${err.path.join('.')}`,
                                message: err.message,
                            }))
                        );
                    }
                }
            }

            if (schemas.params) {
                try {
                    (req as any).params = schemas.params.parse(req.params);
                } catch (error) {
                    if (error instanceof ZodError) {
                        allErrors.push(
                            ...error.issues.map((err: ZodIssue) => ({
                                field: `params.${err.path.join('.')}`,
                                message: err.message,
                            }))
                        );
                    }
                }
            }

            if (allErrors.length > 0) {
                res.status(400).json({
                    success: false,
                    message: 'خطأ في البيانات المدخلة',
                    errors: allErrors,
                });
                return;
            }

            next();
        } catch (error) {
            res.status(500).json(errorResponse('خطأ في التحقق من البيانات', 500));
        }
    };
};
