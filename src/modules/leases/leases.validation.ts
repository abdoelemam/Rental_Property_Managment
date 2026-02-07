import { z } from 'zod';
import { LeaseStatus, PaymentFrequency } from '../../DB/models';

// التحقق من أن التاريخ ليس في الماضي (مقارنة بالـ string لتجنب مشاكل الـ timezone)
const validateFutureOrToday = (date: string) => {
    // مقارنة التواريخ كـ strings بصيغة YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0]; // "2026-02-05"
    const inputDate = date.split('T')[0]; // في حالة إرسال timestamp
    return inputDate >= today;
};

export const createLeaseSchema = z.object({
    unitId: z.number().int().positive('معرف الوحدة مطلوب'),
    tenantId: z.number().int().positive('معرف المستأجر مطلوب'),
    startDate: z.string()
        .refine((date) => !isNaN(Date.parse(date)), 'تاريخ البداية غير صالح')
        .refine(validateFutureOrToday, 'تاريخ البداية لا يمكن أن يكون في الماضي'),
    endDate: z.string()
        .refine((date) => !isNaN(Date.parse(date)), 'تاريخ النهاية غير صالح'),
    monthlyRent: z.number().positive('الإيجار الشهري مطلوب'),
    securityDeposit: z.number().min(0).optional(),
    paymentFrequency: z.enum([
        PaymentFrequency.MONTHLY,
        PaymentFrequency.QUARTERLY,
        PaymentFrequency.SEMI_ANNUAL,
        PaymentFrequency.ANNUAL,
    ]).optional(),
    paymentDay: z.number().int().min(1).max(28).optional(),
    notes: z.string().max(1000).optional(),
}).refine(
    (data) => {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        return end > start;
    },
    {
        message: 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية',
        path: ['endDate'],
    }
);

export const updateLeaseSchema = z.object({
    endDate: z.string()
        .refine((date) => !isNaN(Date.parse(date)), 'تاريخ النهاية غير صالح')
        .optional(),
    monthlyRent: z.number().positive().optional(),
    status: z.enum([
        LeaseStatus.ACTIVE,
        LeaseStatus.EXPIRED,
        LeaseStatus.TERMINATED,
        LeaseStatus.PENDING,
    ]).optional(),
    notes: z.string().max(1000).optional(),
});

export const idParamSchema = z.object({
    id: z.string().regex(/^\d+$/, 'ID يجب أن يكون رقماً').transform(Number),
});

export type CreateLeaseInput = z.infer<typeof createLeaseSchema>;
export type UpdateLeaseInput = z.infer<typeof updateLeaseSchema>;
