import { z } from 'zod';

export const createTenantSchema = z.object({
    name: z.string().min(2, 'اسم المستأجر يجب أن يكون حرفين على الأقل').max(150),
    phone: z.string().min(10, 'رقم الهاتف يجب أن يكون 10 أرقام على الأقل').max(20),
    email: z.string().email('البريد الإلكتروني غير صالح').optional(),
    idNumber: z.string().max(50).optional(),
    idType: z.string().max(50).optional(),
    nationality: z.string().max(50).optional(),
    occupation: z.string().max(100).optional(),
    emergencyContact: z.string().max(20).optional(),
    emergencyContactName: z.string().max(100).optional(),
    address: z.string().max(255).optional(),
    notes: z.string().max(1000).optional(),
});

export const updateTenantSchema = z.object({
    name: z.string().min(2).max(150).optional(),
    phone: z.string().min(10).max(20).optional(),
    email: z.string().email().optional(),
    idNumber: z.string().max(50).optional(),
    idType: z.string().max(50).optional(),
    nationality: z.string().max(50).optional(),
    occupation: z.string().max(100).optional(),
    emergencyContact: z.string().max(20).optional(),
    emergencyContactName: z.string().max(100).optional(),
    address: z.string().max(255).optional(),
    notes: z.string().max(1000).optional(),
    isActive: z.boolean().optional(),
});

export const idParamSchema = z.object({
    id: z.string().regex(/^\d+$/, 'ID يجب أن يكون رقماً').transform(Number),
});

export const querySchema = z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
    search: z.string().optional(),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
