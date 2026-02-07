import { z } from 'zod';
import { UserRole } from '../../DB/models';

export const createUserSchema = z.object({
    name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل').max(100),
    email: z.string().email('البريد الإلكتروني غير صالح'),
    password: z
        .string()
        .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
        .regex(/[A-Z]/, 'يجب أن تحتوي على حرف كبير')
        .regex(/[0-9]/, 'يجب أن تحتوي على رقم'),
    phone: z.string().optional(),
    role: z.enum(['accountant', 'viewer'] as const, {
        message: 'الدور يجب أن يكون accountant أو viewer',
    }),
});

export const updateUserSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    phone: z.string().optional(),
    role: z.enum(['accountant', 'viewer'] as const).optional(),
    isActive: z.boolean().optional(),
});

export const idParamSchema = z.object({
    id: z.string().regex(/^\d+$/, 'ID يجب أن يكون رقماً').transform(Number),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
