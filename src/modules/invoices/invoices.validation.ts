import { z } from 'zod';
import { InvoiceStatus, PaymentMethod } from '../../DB/models';

// Invoices
export const createInvoiceSchema = z.object({
    leaseId: z.number().int().positive('معرف العقد مطلوب'),
    amount: z.number().positive('المبلغ مطلوب'),
    dueDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'تاريخ الاستحقاق غير صالح'),
    description: z.string().max(500).optional(),
});

export const updateInvoiceSchema = z.object({
    amount: z.number().positive().optional(),
    dueDate: z.string().refine((date) => !isNaN(Date.parse(date))).optional(),
    status: z.enum(['pending', 'paid', 'partial', 'overdue', 'cancelled'] as const).optional(),
    description: z.string().max(500).optional(),
});

// Payments
export const createPaymentSchema = z.object({
    invoiceId: z.number().int().positive('معرف الفاتورة مطلوب'),
    amount: z.number().positive('المبلغ مطلوب'),
    paymentDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'تاريخ الدفع غير صالح'),
    paymentMethod: z.enum(['cash', 'bank_transfer', 'check', 'card', 'other'] as const),
    referenceNumber: z.string().max(100).optional(),
    notes: z.string().max(500).optional(),
});

export const idParamSchema = z.object({
    id: z.string().regex(/^\d+$/, 'ID يجب أن يكون رقماً').transform(Number),
});

export const querySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(10),
    status: z.enum(['pending', 'paid', 'partial', 'overdue', 'cancelled'] as const).optional(),
    leaseId: z.coerce.number().int().positive().optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
