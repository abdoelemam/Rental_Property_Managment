import { Op } from 'sequelize';
import { Property, Unit, Lease, Tenant, Invoice, Payment, InvoiceStatus } from '../../DB/models';
import { CreateInvoiceInput, UpdateInvoiceInput, CreatePaymentInput } from './invoices.validation';

interface QueryOptions {
    page: number;
    limit: number;
    status?: string;
    leaseId?: number;
}

export class InvoicesService {
    // التحقق من أن العقد تابع للمستخدم
    private async verifyLeaseOwnership(ownerId: number, leaseId: number) {
        const lease = await Lease.findOne({
            where: { id: leaseId },
            include: [
                {
                    model: Unit,
                    as: 'unit',
                    include: [
                        {
                            model: Property,
                            as: 'property',
                            where: { ownerId },
                        },
                    ],
                },
            ],
        });

        if (!lease || !(lease as any).unit?.property) {
            throw { status: 404, message: 'العقد غير موجود' };
        }

        return lease;
    }

    // توليد رقم فاتورة فريد
    private generateInvoiceNumber(): string {
        return `INV-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    }

    // إنشاء فاتورة
    async create(ownerId: number, data: CreateInvoiceInput) {
        await this.verifyLeaseOwnership(ownerId, data.leaseId);

        const invoice = await Invoice.create({
            leaseId: data.leaseId,
            amount: data.amount,
            description: data.description,
            invoiceNumber: this.generateInvoiceNumber(),
            dueDate: new Date(data.dueDate),
            paidAmount: 0,
            status: InvoiceStatus.PENDING,
        });

        return invoice;
    }

    // جلب جميع الفواتير
    async getAll(ownerId: number, options: QueryOptions) {
        const page = Number(options.page) || 1;
        const limit = Number(options.limit) || 10;
        const { status, leaseId } = options;
        const offset = (page - 1) * limit;

        const where: any = {};

        if (status) {
            where.status = status;
        }

        if (leaseId) {
            where.leaseId = leaseId;
        }

        const invoices = await Invoice.findAll({
            where,
            limit,
            offset,
            order: [['dueDate', 'DESC']],
            include: [
                {
                    model: Lease,
                    as: 'lease',
                    attributes: ['id', 'tenantId', 'monthlyRent'],
                    include: [
                        {
                            model: Unit,
                            as: 'unit',
                            attributes: ['id', 'unitNumber'],
                            include: [
                                {
                                    model: Property,
                                    as: 'property',
                                    where: { ownerId },
                                    attributes: ['id', 'name'],
                                },
                            ],
                        },
                        {
                            model: Tenant,
                            as: 'tenant',
                            attributes: ['id', 'name', 'phone'],
                        },
                    ],
                },
            ],
        });

        // فلترة الفواتير التابعة للمستخدم
        const filteredInvoices = invoices.filter((inv) => (inv as any).lease?.unit?.property);
        const total = filteredInvoices.length;

        return { invoices: filteredInvoices, total, page, limit };
    }

    // جلب فاتورة بالـ ID
    async getById(ownerId: number, invoiceId: number) {
        const invoice = await Invoice.findOne({
            where: { id: invoiceId },
            include: [
                {
                    model: Lease,
                    as: 'lease',
                    include: [
                        {
                            model: Unit,
                            as: 'unit',
                            include: [
                                {
                                    model: Property,
                                    as: 'property',
                                    where: { ownerId },
                                },
                            ],
                        },
                        {
                            model: Tenant,
                            as: 'tenant',
                        },
                    ],
                },
                {
                    model: Payment,
                    as: 'payments',
                },
            ],
        });

        if (!invoice || !(invoice as any).lease?.unit?.property) {
            throw { status: 404, message: 'الفاتورة غير موجودة' };
        }

        return invoice;
    }

    // تعديل فاتورة
    async update(ownerId: number, invoiceId: number, data: UpdateInvoiceInput) {
        const invoice = await this.getById(ownerId, invoiceId);

        // منع تعديل فاتورة ملغية
        if (invoice.status === InvoiceStatus.CANCELLED) {
            throw { status: 400, message: 'لا يمكن تعديل فاتورة ملغية' };
        }

        const updateData: any = { ...data };
        if (data.dueDate) {
            updateData.dueDate = new Date(data.dueDate);
        }

        // 🔄 إعادة حساب الـ status عند تعديل المبلغ
        if (data.amount) {
            const paidAmount = Number(invoice.paidAmount);
            const newAmount = Number(data.amount);

            if (paidAmount === 0) {
                updateData.status = InvoiceStatus.PENDING;
            } else if (paidAmount >= newAmount) {
                updateData.status = InvoiceStatus.PAID;
            } else {
                updateData.status = InvoiceStatus.PARTIAL;
            }
        } else if (data.status) {
            updateData.status = data.status as InvoiceStatus;
        }

        await invoice.update(updateData);

        return invoice;
    }

    // إلغاء فاتورة
    async cancel(ownerId: number, invoiceId: number) {
        const invoice = await this.getById(ownerId, invoiceId);

        if (invoice.paidAmount > 0) {
            throw { status: 400, message: 'لا يمكن إلغاء فاتورة بها مدفوعات' };
        }

        await invoice.update({ status: InvoiceStatus.CANCELLED });

        return { message: 'تم إلغاء الفاتورة بنجاح' };
    }

    // === Payments ===

    // إضافة دفعة
    async addPayment(ownerId: number, userId: number, data: CreatePaymentInput) {
        const invoice = await this.getById(ownerId, data.invoiceId);

        // 🛡️ منع الدفع على فاتورة ملغية أو مدفوعة بالكامل
        if (invoice.status === InvoiceStatus.CANCELLED) {
            throw { status: 400, message: 'لا يمكن إضافة دفعة لفاتورة ملغية' };
        }

        if (invoice.status === InvoiceStatus.PAID) {
            throw { status: 400, message: 'الفاتورة مدفوعة بالكامل' };
        }

        const remainingAmount = Number(invoice.amount) - Number(invoice.paidAmount);

        if (data.amount > remainingAmount) {
            throw { status: 400, message: `المبلغ المتبقي هو ${remainingAmount} فقط` };
        }

        const payment = await Payment.create({
            invoiceId: data.invoiceId,
            amount: data.amount,
            paymentMethod: data.paymentMethod as any,
            referenceNumber: data.referenceNumber,
            notes: data.notes,
            paymentDate: new Date(data.paymentDate),
            createdById: userId,
        });

        // تحديث الفاتورة
        const newPaidAmount = Number(invoice.paidAmount) + data.amount;
        const newStatus = newPaidAmount >= Number(invoice.amount) ? InvoiceStatus.PAID : InvoiceStatus.PARTIAL;

        await invoice.update({
            paidAmount: newPaidAmount,
            status: newStatus,
        });

        return payment;
    }

    // جلب مدفوعات فاتورة
    async getPaymentsByInvoice(ownerId: number, invoiceId: number) {
        await this.getById(ownerId, invoiceId);

        const payments = await Payment.findAll({
            where: { invoiceId },
            order: [['paymentDate', 'DESC']],
        });

        return payments;
    }

    // جلب الفواتير المتأخرة
    async getOverdueInvoices(ownerId: number) {
        const today = new Date();

        const invoices = await Invoice.findAll({
            where: {
                status: { [Op.in]: [InvoiceStatus.PENDING, InvoiceStatus.PARTIAL] },
                dueDate: { [Op.lt]: today },
            },
            include: [
                {
                    model: Lease,
                    as: 'lease',
                    attributes: ['id', 'tenantId', 'monthlyRent'],
                    include: [
                        {
                            model: Unit,
                            as: 'unit',
                            include: [
                                {
                                    model: Property,
                                    as: 'property',
                                    where: { ownerId },
                                },
                            ],
                        },
                        {
                            model: Tenant,
                            as: 'tenant',
                            attributes: ['id', 'name', 'phone'],
                        },
                    ],
                },
            ],
        });

        return invoices.filter((inv) => (inv as any).lease?.unit?.property);
    }
}

export const invoicesService = new InvoicesService();
