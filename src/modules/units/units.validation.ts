import { z } from 'zod';
import { UnitStatus } from '../../DB/models';

export const createUnitSchema = z.object({
    unitNumber: z.string().min(1, 'رقم الوحدة مطلوب').max(50),
    propertyId: z.number().int().positive('معرف العقار مطلوب'),
    floor: z.number().int().optional(),
    bedrooms: z.number().int().min(0).optional(),
    bathrooms: z.number().int().min(0).optional(),
    area: z.number().positive().optional(),
    monthlyRent: z.number().positive('الإيجار الشهري مطلوب'),
    description: z.string().max(1000).optional(),
});

export const updateUnitSchema = z.object({
    unitNumber: z.string().min(1).max(50).optional(),
    floor: z.number().int().optional(),
    bedrooms: z.number().int().min(0).optional(),
    bathrooms: z.number().int().min(0).optional(),
    area: z.number().positive().optional(),
    monthlyRent: z.number().positive().optional(),
    status: z.enum([UnitStatus.VACANT, UnitStatus.OCCUPIED, UnitStatus.MAINTENANCE]).optional(),
    description: z.string().max(1000).optional(),
    isActive: z.boolean().optional(),
});

export const idParamSchema = z.object({
    id: z.string().regex(/^\d+$/, 'ID يجب أن يكون رقماً').transform(Number),
});

export const propertyIdParamSchema = z.object({
    propertyId: z.string().regex(/^\d+$/, 'معرف العقار يجب أن يكون رقماً').transform(Number),
});

export const updateStatusSchema = z.object({
    status: z.enum([UnitStatus.VACANT, UnitStatus.OCCUPIED, UnitStatus.MAINTENANCE], {
        message: 'الحالة غير صالحة',
    }),
});

export type CreateUnitInput = z.infer<typeof createUnitSchema>;
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
