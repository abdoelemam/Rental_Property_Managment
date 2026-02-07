import { Op } from 'sequelize';
import { Property, Unit, UserRole, PropertyType } from '../../DB/models';
import { CreatePropertyInput, UpdatePropertyInput } from './properties.validation';

interface QueryOptions {
    page: number;
    limit: number;
    city?: string;
    type?: string;
    search?: string;
}

export class PropertiesService {
    // الحصول على الـ Owner ID (لو المستخدم team member نجيب الـ parent)
    private getOwnerId(user: { id: number; role: string; parentId?: number }): number {
        // لو المستخدم Owner نرجع الـ ID بتاعه
        // لو Accountant أو Viewer نرجع الـ parentId
        return user.role === UserRole.OWNER ? user.id : (user as any).parentId || user.id;
    }

    // إنشاء عقار جديد
    async create(userId: number, data: CreatePropertyInput) {
        const property = await Property.create({
            name: data.name,
            address: data.address,
            city: data.city,
            type: (data.type || PropertyType.RESIDENTIAL) as PropertyType,
            description: data.description,
            ownerId: userId,
        });

        return property;
    }

    // جلب جميع العقارات
    async getAll(ownerId: number, options: QueryOptions) {
        const page = Number(options.page) || 1;
        const limit = Number(options.limit) || 10;
        const { city, type, search } = options;
        const offset = (page - 1) * limit;

        const where: any = { ownerId, isActive: true };

        if (city) {
            where.city = city;
        }

        if (type) {
            where.type = type;
        }

        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { address: { [Op.like]: `%${search}%` } },
            ];
        }

        const { rows: properties, count: total } = await Property.findAndCountAll({
            where,
            limit,
            offset,
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: Unit,
                    as: 'units',
                    attributes: ['id', 'status'],
                },
            ],
        });

        return { properties, total, page, limit };
    }

    // جلب عقار بالـ ID
    async getById(ownerId: number, propertyId: number) {
        const property = await Property.findOne({
            where: { id: propertyId, ownerId },
            include: [
                {
                    model: Unit,
                    as: 'units',
                },
            ],
        });

        if (!property) {
            throw { status: 404, message: 'العقار غير موجود' };
        }

        return property;
    }

    // تعديل عقار
    async update(ownerId: number, propertyId: number, data: UpdatePropertyInput) {
        const property = await Property.findOne({
            where: { id: propertyId, ownerId },
        });

        if (!property) {
            throw { status: 404, message: 'العقار غير موجود' };
        }

        const updateData: any = { ...data };
        if (data.type) {
            updateData.type = data.type as PropertyType;
        }

        await property.update(updateData);

        return property;
    }

    // حذف عقار (Soft Delete)
    async delete(ownerId: number, propertyId: number) {
        const property = await Property.findOne({
            where: { id: propertyId, ownerId },
        });

        if (!property) {
            throw { status: 404, message: 'العقار غير موجود' };
        }

        await property.update({ isActive: false });

        return { message: 'تم حذف العقار بنجاح' };
    }

    // إحصائيات العقار
    async getStats(ownerId: number, propertyId: number) {
        const property = await Property.findOne({
            where: { id: propertyId, ownerId },
            include: [
                {
                    model: Unit,
                    as: 'units',
                },
            ],
        });

        if (!property) {
            throw { status: 404, message: 'العقار غير موجود' };
        }

        const units = (property as any).units || [];
        const totalUnits = units.length;
        const occupiedUnits = units.filter((u: any) => u.status === 'occupied').length;
        const vacantUnits = units.filter((u: any) => u.status === 'vacant').length;
        const maintenanceUnits = units.filter((u: any) => u.status === 'maintenance').length;

        return {
            propertyId: property.id,
            propertyName: property.name,
            totalUnits,
            occupiedUnits,
            vacantUnits,
            maintenanceUnits,
            occupancyRate: totalUnits > 0 ? ((occupiedUnits / totalUnits) * 100).toFixed(1) : 0,
        };
    }
}

export const propertiesService = new PropertiesService();
