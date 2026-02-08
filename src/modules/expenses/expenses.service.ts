import { Op } from 'sequelize';
import { Property, Unit, Expense, ExpenseCategory } from '../../DB/models';
import { CreateExpenseInput, UpdateExpenseInput } from './expenses.validation';

interface QueryOptions {
    page: number;
    limit: number;
    propertyId?: number;
    unitId?: number;
    category?: string;
    startDate?: string;
    endDate?: string;
}

export class ExpensesService {
    // التحقق من ملكية العقار
    private async verifyPropertyOwnership(ownerId: number, propertyId: number) {
        const property = await Property.findOne({
            where: { id: propertyId, ownerId, isActive: true },
        });

        if (!property) {
            throw { status: 404, message: 'العقار غير موجود' };
        }

        return property;
    }

    // التحقق من ملكية الوحدة
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

    // إنشاء مصروف جديد
    async create(ownerId: number, userId: number, data: CreateExpenseInput) {
        await this.verifyPropertyOwnership(ownerId, data.propertyId);

        if (data.unitId) {
            await this.verifyUnitOwnership(ownerId, data.unitId);
        }

        const expense = await Expense.create({
            propertyId: data.propertyId,
            unitId: data.unitId,
            category: data.category as ExpenseCategory,
            amount: data.amount,
            expenseDate: new Date(data.expenseDate),
            description: data.description,
            vendor: data.vendor,
            receiptNumber: data.receiptNumber,
            createdById: userId,
        });

        return expense;
    }

    // جلب جميع المصروفات
    async getAll(ownerId: number, options: QueryOptions) {
        const page = Number(options.page) || 1;
        const limit = Number(options.limit) || 10;
        const offset = (page - 1) * limit;

        const where: any = {};

        if (options.propertyId) {
            where.propertyId = options.propertyId;
        }

        if (options.unitId) {
            where.unitId = options.unitId;
        }

        if (options.category) {
            where.category = options.category;
        }

        if (options.startDate && options.endDate) {
            where.expenseDate = {
                [Op.between]: [new Date(options.startDate), new Date(options.endDate)],
            };
        } else if (options.startDate) {
            where.expenseDate = { [Op.gte]: new Date(options.startDate) };
        } else if (options.endDate) {
            where.expenseDate = { [Op.lte]: new Date(options.endDate) };
        }

        const { count, rows } = await Expense.findAndCountAll({
            where,
            limit,
            offset,
            order: [['expenseDate', 'DESC']],
            include: [
                {
                    model: Property,
                    as: 'property',
                    where: { ownerId },
                    attributes: ['id', 'name'],
                },
                {
                    model: Unit,
                    as: 'unit',
                    attributes: ['id', 'unitNumber'],
                    required: false,
                },
            ],
        });

        return { expenses: rows, total: count, page, limit };
    }

    // جلب مصروف بالـ ID
    async getById(ownerId: number, expenseId: number) {
        const expense = await Expense.findOne({
            where: { id: expenseId },
            include: [
                {
                    model: Property,
                    as: 'property',
                    where: { ownerId },
                },
                {
                    model: Unit,
                    as: 'unit',
                    required: false,
                },
            ],
        });

        if (!expense) {
            throw { status: 404, message: 'المصروف غير موجود' };
        }

        return expense;
    }

    // تعديل مصروف
    async update(ownerId: number, expenseId: number, data: UpdateExpenseInput) {
        const expense = await this.getById(ownerId, expenseId);

        const updateData: any = { ...data };
        if (data.expenseDate) {
            updateData.expenseDate = new Date(data.expenseDate);
        }
        if (data.category) {
            updateData.category = data.category as ExpenseCategory;
        }

        await expense.update(updateData);

        return expense;
    }

    // حذف مصروف
    async delete(ownerId: number, expenseId: number) {
        const expense = await this.getById(ownerId, expenseId);
        await expense.destroy();
        return { message: 'تم حذف المصروف بنجاح' };
    }

    // إحصائيات المصروفات
    async getStats(ownerId: number, year?: number, month?: number) {
        const currentYear = year || new Date().getFullYear();
        const currentMonth = month || new Date().getMonth() + 1;

        const startDate = new Date(currentYear, currentMonth - 1, 1);
        const endDate = new Date(currentYear, currentMonth, 0);

        const expenses = await Expense.findAll({
            where: {
                expenseDate: { [Op.between]: [startDate, endDate] },
            },
            include: [
                {
                    model: Property,
                    as: 'property',
                    where: { ownerId },
                    attributes: [],
                },
            ],
        });

        const total = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

        // تجميع حسب الفئة
        const byCategory: Record<string, number> = {};
        expenses.forEach((exp) => {
            if (!byCategory[exp.category]) {
                byCategory[exp.category] = 0;
            }
            byCategory[exp.category] += Number(exp.amount);
        });

        return {
            period: { year: currentYear, month: currentMonth },
            total,
            count: expenses.length,
            byCategory,
        };
    }
}

export const expensesService = new ExpensesService();
