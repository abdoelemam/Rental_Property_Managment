import { z } from 'zod';
import { PropertyType } from '../../DB/models';

export const createPropertySchema = z.object({
    name: z.string().min(2, 'اسم العقار يجب أن يكون حرفين على الأقل').max(150),
    address: z.string().min(5, 'العنوان يجب أن يكون 5 أحرف على الأقل').max(255),
    city: z.string().min(2, 'اسم المدينة مطلوب').max(100),
    type: z.enum(['residential', 'commercial', 'mixed'] as const).default('residential'),
    description: z.string().max(1000).optional(),
});

export const updatePropertySchema = z.object({
    name: z.string().min(2).max(150).optional(),
    address: z.string().min(5).max(255).optional(),
    city: z.string().min(2).max(100).optional(),
    type: z.enum(['residential', 'commercial', 'mixed'] as const).optional(),
    description: z.string().max(1000).optional(),
    isActive: z.boolean().optional(),
});

export const idParamSchema = z.object({
    id: z.string().regex(/^\d+$/, 'ID يجب أن يكون رقماً').transform(Number),
});

export const querySchema = z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
    city: z.string().optional(),
    type: z.enum(['residential', 'commercial', 'mixed'] as const).optional(),
    search: z.string().optional(),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
