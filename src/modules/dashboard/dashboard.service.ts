import { Op, fn, col, literal } from 'sequelize';
import { Property, Unit, Lease, Invoice, Payment, Expense, UnitStatus, LeaseStatus, InvoiceStatus } from '../../DB/models';
import { aiService } from '../../services/ai.service';

export class DashboardService {
    // إحصائيات عامة
    async getOverview(ownerId: number) {
        // إجمالي العقارات
        const totalProperties = await Property.count({
            where: { ownerId, isActive: true },
        });

        // إجمالي الوحدات
        const totalUnits = await Unit.count({
            include: [
                {
                    model: Property,
                    as: 'property',
                    where: { ownerId, isActive: true },
                    attributes: [],
                },
            ],
            where: { isActive: true },
        });

        // الوحدات حسب الحالة
        const occupiedUnits = await Unit.count({
            include: [
                {
                    model: Property,
                    as: 'property',
                    where: { ownerId, isActive: true },
                    attributes: [],
                },
            ],
            where: { isActive: true, status: UnitStatus.OCCUPIED },
        });

        const vacantUnits = await Unit.count({
            include: [
                {
                    model: Property,
                    as: 'property',
                    where: { ownerId, isActive: true },
                    attributes: [],
                },
            ],
            where: { isActive: true, status: UnitStatus.VACANT },
        });

        // نسبة الإشغال
        const occupancyRate = totalUnits > 0 ? ((occupiedUnits / totalUnits) * 100).toFixed(1) : 0;

        // العقود النشطة
        const activeLeases = await Lease.count({
            where: { status: LeaseStatus.ACTIVE },
            include: [
                {
                    model: Unit,
                    as: 'unit',
                    include: [
                        {
                            model: Property,
                            as: 'property',
                            where: { ownerId },
                            attributes: [],
                        },
                    ],
                },
            ],
        });

        return {
            totalProperties,
            totalUnits,
            occupiedUnits,
            vacantUnits,
            occupancyRate: Number(occupancyRate),
            activeLeases,
        };
    }

    // الإحصائيات المالية
    async getFinancialStats(ownerId: number, year?: number, month?: number) {
        const currentYear = year || new Date().getFullYear();
        const currentMonth = month || new Date().getMonth() + 1;

        // بداية ونهاية الشهر
        const startDate = new Date(currentYear, currentMonth - 1, 1);
        const endDate = new Date(currentYear, currentMonth, 0);

        // جلب الفواتير الخاصة بالمستخدم
        const invoices = await Invoice.findAll({
            where: {
                dueDate: { [Op.between]: [startDate, endDate] },
            },
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
                                    attributes: [],
                                },
                            ],
                        },
                    ],
                },
            ],
        });

        const filteredInvoices = invoices.filter((inv) => (inv as any).lease?.unit?.property);

        // حسابات
        const expectedIncome = filteredInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
        const collectedIncome = filteredInvoices.reduce((sum, inv) => sum + Number(inv.paidAmount), 0);
        const pendingPayments = expectedIncome - collectedIncome;

        // المصروفات
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

        const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
        const netIncome = collectedIncome - totalExpenses;

        // الفواتير المتأخرة
        const overdueInvoices = filteredInvoices.filter(
            (inv) => inv.status === InvoiceStatus.OVERDUE ||
                (inv.status === InvoiceStatus.PENDING && new Date(inv.dueDate) < new Date())
        );
        const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + (Number(inv.amount) - Number(inv.paidAmount)), 0);

        return {
            period: { year: currentYear, month: currentMonth },
            expectedIncome,
            collectedIncome,
            pendingPayments,
            totalExpenses,
            netIncome,
            overdueAmount,
            overdueCount: overdueInvoices.length,
            collectionRate: expectedIncome > 0 ? ((collectedIncome / expectedIncome) * 100).toFixed(1) : 0,
        };
    }

    // إحصائيات الإيرادات الشهرية (آخر 12 شهر)
    async getMonthlyRevenue(ownerId: number) {
        const months: { month: string; income: number; expenses: number }[] = [];
        const today = new Date();

        for (let i = 11; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;

            const stats = await this.getFinancialStats(ownerId, year, month);

            months.push({
                month: `${year}-${month.toString().padStart(2, '0')}`,
                income: stats.collectedIncome,
                expenses: stats.totalExpenses,
            });
        }

        return months;
    }

    // أعلى العقارات أداءً
    async getTopProperties(ownerId: number, limit: number = 5) {
        const properties = await Property.findAll({
            where: { ownerId, isActive: true },
            include: [
                {
                    model: Unit,
                    as: 'units',
                    where: { isActive: true },
                    required: false,
                },
            ],
        });

        const propertyStats = properties.map((prop) => {
            const units = (prop as any).units || [];
            const totalUnits = units.length;
            const occupiedUnits = units.filter((u: any) => u.status === UnitStatus.OCCUPIED).length;
            const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

            return {
                id: prop.id,
                name: prop.name,
                city: prop.city,
                totalUnits,
                occupiedUnits,
                occupancyRate: Number(occupancyRate.toFixed(1)),
            };
        });

        // ترتيب حسب نسبة الإشغال
        return propertyStats.sort((a, b) => b.occupancyRate - a.occupancyRate).slice(0, limit);
    }

    // تحليل ذكي بالـ AI
    async getAIAnalysis(ownerId: number) {
        const overview = await this.getOverview(ownerId);
        const financials = await this.getFinancialStats(ownerId);

        const analysis = await aiService.analyzePropertyData({
            totalIncome: financials.collectedIncome,
            totalExpenses: financials.totalExpenses,
            occupancyRate: overview.occupancyRate,
            overduePayments: financials.overdueAmount,
        });

        return { analysis };
    }
}

export const dashboardService = new DashboardService();
