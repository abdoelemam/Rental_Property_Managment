import { z } from 'zod';
import { ExpenseCategory } from '../../DB/models';

export const createExpenseSchema = z.object({
    propertyId: z.number().int().positive('معرف العقار مطلوب'),
    unitId: z.number().int().positive().optional(),
    category: z.enum(['maintenance', 'utilities', 'repairs', 'insurance', 'taxes', 'management', 'other'] as const),
    amount: z.number().positive('المبلغ مطلوب'),
    expenseDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'تاريخ المصروف غير صالح'),
    description: z.string().min(1, 'الوصف مطلوب').max(500),
    vendor: z.string().max(150).optional(),
    receiptNumber: z.string().max(100).optional(),
});

export const updateExpenseSchema = z.object({
    category: z.enum(['maintenance', 'utilities', 'repairs', 'insurance', 'taxes', 'management', 'other'] as const).optional(),
    amount: z.number().positive().optional(),
    expenseDate: z.string().refine((date) => !isNaN(Date.parse(date))).optional(),
    description: z.string().min(1).max(500).optional(),
    vendor: z.string().max(150).optional(),
    receiptNumber: z.string().max(100).optional(),
});

export const idParamSchema = z.object({
    id: z.string().regex(/^\d+$/, 'ID يجب أن يكون رقماً').transform(Number),
});

export const querySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(10),
    propertyId: z.coerce.number().int().positive().optional(),
    unitId: z.coerce.number().int().positive().optional(),
    category: z.enum(['maintenance', 'utilities', 'repairs', 'insurance', 'taxes', 'management', 'other'] as const).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
