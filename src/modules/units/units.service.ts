import { Property, Unit, UnitStatus } from '../../DB/models';
import { CreateUnitInput, UpdateUnitInput } from './units.validation';

export class UnitsService {
    // التحقق من أن العقار يخص المستخدم
    private async verifyPropertyOwnership(ownerId: number, propertyId: number) {
        const property = await Property.findOne({
            where: { id: propertyId, ownerId, isActive: true },
        });

        if (!property) {
            throw { status: 404, message: 'العقار غير موجود' };
        }

        return property;
    }

    // إنشاء وحدة جديدة
    async create(ownerId: number, data: CreateUnitInput) {
        await this.verifyPropertyOwnership(ownerId, data.propertyId);

        // التحقق من عدم تكرار رقم الوحدة في نفس العقار
        const existingUnit = await Unit.findOne({
            where: { propertyId: data.propertyId, unitNumber: data.unitNumber },
        });

        if (existingUnit) {
            throw { status: 400, message: 'رقم الوحدة موجود بالفعل في هذا العقار' };
        }

        const unit = await Unit.create({
            ...data,
            status: UnitStatus.VACANT,
        });

        // تحديث عدد الوحدات في العقار
        await Property.increment('totalUnits', { where: { id: data.propertyId } });

        return unit;
    }

    // جلب وحدات عقار معين
    async getByPropertyId(ownerId: number, propertyId: number) {
        await this.verifyPropertyOwnership(ownerId, propertyId);

        const units = await Unit.findAll({
            where: { propertyId, isActive: true },
            order: [['unitNumber', 'ASC']],
        });

        return units;
    }

    // جلب وحدة بالـ ID
    async getById(ownerId: number, unitId: number) {
        const unit = await Unit.findOne({
            where: { id: unitId, isActive: true },
            include: [
                {
                    model: Property,
                    as: 'property',
                    where: { ownerId },
                    attributes: ['id', 'name', 'address'],
                },
            ],
        });

        if (!unit) {
            throw { status: 404, message: 'الوحدة غير موجودة' };
        }

        return unit;
    }

    // تعديل وحدة
    async update(ownerId: number, unitId: number, data: UpdateUnitInput) {
        const unit = await this.getById(ownerId, unitId);
        await unit.update(data);
        return unit;
    }

    // حذف وحدة (Soft Delete)
    async delete(ownerId: number, unitId: number) {
        const unit = await this.getById(ownerId, unitId);
        await unit.update({ isActive: false });

        // تحديث عدد الوحدات في العقار
        await Property.decrement('totalUnits', { where: { id: unit.propertyId } });

        return { message: 'تم حذف الوحدة بنجاح' };
    }

    // استرجاع وحدة محذوفة
    async restore(ownerId: number, unitId: number) {
        const unit = await Unit.findOne({
            where: { id: unitId, isActive: false },
            include: [
                {
                    model: Property,
                    as: 'property',
                    where: { ownerId },
                    attributes: ['id', 'name'],
                },
            ],
        });

        if (!unit) {
            throw { status: 404, message: 'الوحدة غير موجودة أو غير محذوفة' };
        }

        await unit.update({ isActive: true });

        // تحديث عدد الوحدات في العقار
        await Property.increment('totalUnits', { where: { id: unit.propertyId } });

        return { message: 'تم استرجاع الوحدة بنجاح', unit };
    }

    // تغيير حالة الوحدة
    async updateStatus(ownerId: number, unitId: number, status: UnitStatus) {
        const unit = await this.getById(ownerId, unitId);
        await unit.update({ status });

        return {
            id: unit.id,
            unitNumber: unit.unitNumber,
            status: unit.status,
            message: `تم تغيير حالة الوحدة إلى ${status}`,
        };
    }

    // جلب الوحدات الفارغة
    async getVacantUnits(ownerId: number, propertyId?: number) {
        const where: any = { status: UnitStatus.VACANT, isActive: true };

        const include = [
            {
                model: Property,
                as: 'property',
                where: { ownerId, isActive: true },
                attributes: ['id', 'name', 'address'],
            },
        ];

        if (propertyId) {
            where.propertyId = propertyId;
        }

        const units = await Unit.findAll({ where, include });

        return units;
    }
}

export const unitsService = new UnitsService();
