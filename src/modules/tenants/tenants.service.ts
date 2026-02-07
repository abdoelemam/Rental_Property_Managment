import { Op } from 'sequelize';
import { Tenant, Lease } from '../../DB/models';
import { CreateTenantInput, UpdateTenantInput } from './tenants.validation';

interface QueryOptions {
    page?: number;
    limit?: number;
    search?: string;
}

export class TenantsService {
    // إنشاء مستأجر جديد
    async create(ownerId: number, data: CreateTenantInput) {
        const tenant = await Tenant.create({
            ...data,
            ownerId,
        });

        return tenant;
    }

    // جلب جميع المستأجرين
    async getAll(ownerId: number, options: QueryOptions) {
        const page = Number(options.page) || 1;
        const limit = Number(options.limit) || 10;
        const { search } = options;
        const offset = (page - 1) * limit;

        const where: any = { ownerId, isActive: true };

        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { phone: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { idNumber: { [Op.like]: `%${search}%` } },
            ];
        }

        const { rows: tenants, count: total } = await Tenant.findAndCountAll({
            where,
            limit,
            offset,
            order: [['createdAt', 'DESC']],
        });

        return { tenants, total, page, limit };
    }

    // جلب مستأجر بالـ ID
    async getById(ownerId: number, tenantId: number) {
        const tenant = await Tenant.findOne({
            where: { id: tenantId, ownerId },
            include: [
                {
                    model: Lease,
                    as: 'leases',
                    attributes: ['id', 'unitId', 'startDate', 'endDate', 'status', 'monthlyRent'],
                },
            ],
        });

        if (!tenant) {
            throw { status: 404, message: 'المستأجر غير موجود' };
        }

        return tenant;
    }

    // تعديل مستأجر
    async update(ownerId: number, tenantId: number, data: UpdateTenantInput) {
        const tenant = await Tenant.findOne({
            where: { id: tenantId, ownerId },
        });

        if (!tenant) {
            throw { status: 404, message: 'المستأجر غير موجود' };
        }

        await tenant.update(data);

        return tenant;
    }

    // حذف مستأجر (Soft Delete)
    async delete(ownerId: number, tenantId: number) {
        const tenant = await Tenant.findOne({
            where: { id: tenantId, ownerId },
        });

        if (!tenant) {
            throw { status: 404, message: 'المستأجر غير موجود' };
        }

        // تحقق من عدم وجود عقود نشطة
        const activeLeases = await Lease.count({
            where: { tenantId, status: 'active' },
        });

        if (activeLeases > 0) {
            throw { status: 400, message: 'لا يمكن حذف مستأجر لديه عقود نشطة' };
        }

        await tenant.update({ isActive: false });

        return { message: 'تم حذف المستأجر بنجاح' };
    }

    // تفعيل/إلغاء تفعيل المستأجر
    async toggleStatus(ownerId: number, tenantId: number) {
        const tenant = await Tenant.findOne({
            where: { id: tenantId, ownerId },
        });

        if (!tenant) {
            throw { status: 404, message: 'المستأجر غير موجود' };
        }

        await tenant.update({ isActive: !tenant.isActive });

        return {
            id: tenant.id,
            isActive: tenant.isActive,
            message: tenant.isActive ? 'تم تفعيل المستأجر' : 'تم إلغاء تفعيل المستأجر',
        };
    }
}

export const tenantsService = new TenantsService();
