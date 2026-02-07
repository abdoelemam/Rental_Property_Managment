import { Op } from 'sequelize';
import { Property, Unit, Tenant, Lease, Invoice, LeaseStatus, UnitStatus, PaymentFrequency, InvoiceStatus } from '../../DB/models';
import { CreateLeaseInput, UpdateLeaseInput } from './leases.validation';

export class LeasesService {
    // التحقق من أن الوحدة تابعة لعقار المستخدم
    private async verifyUnitOwnership(ownerId: number, unitId: number) {
        const unit = await Unit.findOne({
            where: { id: unitId, isActive: true },
            include: [
                {
                    model: Property,
                    as: 'property',
                    where: { ownerId },
                },
            ],
        });

        if (!unit) {
            throw { status: 404, message: 'الوحدة غير موجودة' };
        }

        return unit;
    }

    // التحقق من أن المستأجر تابع للمستخدم
    private async verifyTenantOwnership(ownerId: number, tenantId: number) {
        const tenant = await Tenant.findOne({
            where: { id: tenantId, ownerId, isActive: true },
        });

        if (!tenant) {
            throw { status: 404, message: 'المستأجر غير موجود' };
        }

        return tenant;
    }

    // توليد رقم فاتورة فريد
    private generateInvoiceNumber(): string {
        return `INV-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    }

    // إنشاء عقد جديد
    async create(ownerId: number, data: CreateLeaseInput) {
        const unit = await this.verifyUnitOwnership(ownerId, data.unitId);
        await this.verifyTenantOwnership(ownerId, data.tenantId);

        // التحقق من أن الوحدة فارغة
        if (unit.status === UnitStatus.OCCUPIED) {
            throw { status: 400, message: 'الوحدة مشغولة بالفعل' };
        }

        // التحقق من عدم وجود عقد نشط للوحدة
        const activeLeaseExists = await Lease.findOne({
            where: {
                unitId: data.unitId,
                status: LeaseStatus.ACTIVE,
            },
        });

        if (activeLeaseExists) {
            throw { status: 400, message: 'يوجد عقد نشط لهذه الوحدة' };
        }

        const lease = await Lease.create({
            unitId: data.unitId,
            tenantId: data.tenantId,
            monthlyRent: data.monthlyRent,
            securityDeposit: data.securityDeposit,
            notes: data.notes,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            paymentFrequency: (data.paymentFrequency || PaymentFrequency.MONTHLY) as PaymentFrequency,
            paymentDay: data.paymentDay || 1,
            status: LeaseStatus.ACTIVE,
        });

        // تحديث حالة الوحدة
        await unit.update({ status: UnitStatus.OCCUPIED });

        // 🧾 إنشاء فاتورة الشهر الأول تلقائياً
        const startDate = new Date(data.startDate);
        const paymentDay = data.paymentDay || 1;
        const dueDate = new Date(startDate.getFullYear(), startDate.getMonth(), paymentDay);

        // لو يوم الاستحقاق فات في هذا الشهر، خليه نفس تاريخ البداية
        if (dueDate < startDate) {
            dueDate.setTime(startDate.getTime());
        }

        await Invoice.create({
            leaseId: lease.id,
            invoiceNumber: this.generateInvoiceNumber(),
            amount: data.monthlyRent,
            paidAmount: 0,
            dueDate,
            status: InvoiceStatus.PENDING,
            description: `فاتورة إيجار - ${startDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}`,
        });

        return lease;
    }

    // جلب جميع العقود
    async getAll(ownerId: number, status?: LeaseStatus) {
        const where: any = {};

        if (status) {
            where.status = status;
        }

        const leases = await Lease.findAll({
            where,
            include: [
                {
                    model: Unit,
                    as: 'unit',
                    include: [
                        {
                            model: Property,
                            as: 'property',
                            where: { ownerId },
                            attributes: ['id', 'name', 'address'],
                        },
                    ],
                },
                {
                    model: Tenant,
                    as: 'tenant',
                    attributes: ['id', 'name', 'phone', 'email'],
                },
            ],
            order: [['createdAt', 'DESC']],
        });

        // نفلتر العقود اللي مش تابعة للمستخدم
        return leases.filter((lease) => (lease as any).unit?.property);
    }

    // جلب عقد بالـ ID
    async getById(ownerId: number, leaseId: number) {
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
                {
                    model: Tenant,
                    as: 'tenant',
                },
            ],
        });

        if (!lease || !(lease as any).unit?.property) {
            throw { status: 404, message: 'العقد غير موجود' };
        }

        return lease;
    }

    // تعديل عقد
    async update(ownerId: number, leaseId: number, data: UpdateLeaseInput) {
        const lease = await this.getById(ownerId, leaseId);

        // 🛡️ منع تفعيل عقد لو في عقد تاني active لنفس الوحدة
        if (data.status === LeaseStatus.ACTIVE && lease.status !== LeaseStatus.ACTIVE) {
            const existingActiveLease = await Lease.findOne({
                where: {
                    unitId: lease.unitId,
                    status: LeaseStatus.ACTIVE,
                    id: { [Op.ne]: leaseId }, // استثناء العقد الحالي
                },
            });

            if (existingActiveLease) {
                throw { status: 400, message: 'يوجد عقد نشط آخر لهذه الوحدة، لا يمكن تفعيل عقدين لنفس الوحدة' };
            }
        }

        const updateData: any = { ...data };
        if (data.endDate) {
            updateData.endDate = new Date(data.endDate);
        }
        if (data.status) {
            updateData.status = data.status as LeaseStatus;
        }

        await lease.update(updateData);

        // تحديث حالة الوحدة حسب حالة العقد
        if (data.status === LeaseStatus.ACTIVE) {
            await Unit.update(
                { status: UnitStatus.OCCUPIED },
                { where: { id: lease.unitId } }
            );
        } else if (data.status === LeaseStatus.TERMINATED || data.status === LeaseStatus.EXPIRED) {
            // تحقق إن مفيش عقود active تانية للوحدة
            const otherActiveLeases = await Lease.count({
                where: {
                    unitId: lease.unitId,
                    status: LeaseStatus.ACTIVE,
                    id: { [Op.ne]: leaseId },
                },
            });
            if (otherActiveLeases === 0) {
                await Unit.update(
                    { status: UnitStatus.VACANT },
                    { where: { id: lease.unitId } }
                );
            }
        }

        return lease;
    }

    // إنهاء عقد
    async terminate(ownerId: number, leaseId: number) {
        const lease = await this.getById(ownerId, leaseId);

        await lease.update({ status: LeaseStatus.TERMINATED });

        // تحديث حالة الوحدة
        await Unit.update(
            { status: UnitStatus.VACANT },
            { where: { id: lease.unitId } }
        );

        return { message: 'تم إنهاء العقد بنجاح' };
    }

    // تجديد عقد
    async renew(ownerId: number, leaseId: number, newEndDate: string, newRent?: number) {
        const lease = await this.getById(ownerId, leaseId);

        const updateData: any = {
            endDate: new Date(newEndDate),
            status: LeaseStatus.ACTIVE,
        };

        if (newRent) {
            updateData.monthlyRent = newRent;
        }

        await lease.update(updateData);

        return lease;
    }

    // العقود المنتهية قريباً (خلال 30 يوم)
    async getExpiringLeases(ownerId: number) {
        const today = new Date();
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(today.getDate() + 30);

        const leases = await Lease.findAll({
            where: {
                status: LeaseStatus.ACTIVE,
                endDate: {
                    [Op.between]: [today, thirtyDaysLater],
                },
            },
            include: [
                {
                    model: Unit,
                    as: 'unit',
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
        });

        return leases.filter((lease) => (lease as any).unit?.property);
    }
}

export const leasesService = new LeasesService();
