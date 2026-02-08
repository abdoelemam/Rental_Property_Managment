import { Op, fn, col, literal } from 'sequelize';
import { Property, Unit, Lease, Invoice, Payment, Expense, Tenant, UnitStatus, LeaseStatus, InvoiceStatus } from '../../DB/models';
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

    // 🆕 إيرادات كل عقار
    async getRevenuePerProperty(ownerId: number, year?: number, month?: number) {
        const currentYear = year || new Date().getFullYear();
        const currentMonth = month || new Date().getMonth() + 1;
        const startDate = new Date(currentYear, currentMonth - 1, 1);
        const endDate = new Date(currentYear, currentMonth, 0);

        const properties = await Property.findAll({
            where: { ownerId, isActive: true },
            include: [
                {
                    model: Unit,
                    as: 'units',
                    where: { isActive: true },
                    required: false,
                    include: [
                        {
                            model: Lease,
                            as: 'leases',
                            required: false,
                            include: [
                                {
                                    model: Invoice,
                                    as: 'invoices',
                                    where: {
                                        dueDate: { [Op.between]: [startDate, endDate] },
                                    },
                                    required: false,
                                },
                            ],
                        },
                    ],
                },
            ],
        });

        return properties.map((prop) => {
            const units = (prop as any).units || [];
            let totalRevenue = 0;
            let collectedRevenue = 0;

            units.forEach((unit: any) => {
                const leases = unit.leases || [];
                leases.forEach((lease: any) => {
                    const invoices = lease.invoices || [];
                    invoices.forEach((inv: any) => {
                        totalRevenue += Number(inv.amount);
                        collectedRevenue += Number(inv.paidAmount);
                    });
                });
            });

            return {
                id: prop.id,
                name: prop.name,
                city: prop.city,
                totalRevenue,
                collectedRevenue,
                outstandingBalance: totalRevenue - collectedRevenue,
            };
        });
    }

    // 🆕 توزيع المصروفات حسب الفئة
    async getExpensesBreakdown(ownerId: number, year?: number, month?: number) {
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

        const byCategory: Record<string, { amount: number; percentage: number }> = {};
        expenses.forEach((exp) => {
            if (!byCategory[exp.category]) {
                byCategory[exp.category] = { amount: 0, percentage: 0 };
            }
            byCategory[exp.category].amount += Number(exp.amount);
        });

        // حساب النسب
        Object.keys(byCategory).forEach((cat) => {
            byCategory[cat].percentage = total > 0 ? Number(((byCategory[cat].amount / total) * 100).toFixed(1)) : 0;
        });

        return {
            period: { year: currentYear, month: currentMonth },
            total,
            count: expenses.length,
            breakdown: byCategory,
        };
    }

    // 🆕 العقود اللي أوشكت على الانتهاء
    async getExpiringLeases(ownerId: number, days: number = 30) {
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + days);

        const leases = await Lease.findAll({
            where: {
                status: LeaseStatus.ACTIVE,
                endDate: { [Op.between]: [today, futureDate] },
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

        return leases.filter((l) => (l as any).unit?.property).map((lease) => ({
            id: lease.id,
            endDate: lease.endDate,
            daysRemaining: Math.ceil((new Date(lease.endDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
            monthlyRent: lease.monthlyRent,
            tenant: (lease as any).tenant,
            unit: {
                id: (lease as any).unit.id,
                unitNumber: (lease as any).unit.unitNumber,
            },
            property: {
                id: (lease as any).unit.property.id,
                name: (lease as any).unit.property.name,
            },
        }));
    }

    // 🆕 الفواتير المتأخرة
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
                },
            ],
            order: [['dueDate', 'ASC']],
        });

        return invoices.filter((inv) => (inv as any).lease?.unit?.property).map((invoice) => ({
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            amount: invoice.amount,
            paidAmount: invoice.paidAmount,
            remainingAmount: Number(invoice.amount) - Number(invoice.paidAmount),
            dueDate: invoice.dueDate,
            daysOverdue: Math.ceil((today.getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)),
            tenant: (invoice as any).lease.tenant,
            unit: {
                id: (invoice as any).lease.unit.id,
                unitNumber: (invoice as any).lease.unit.unitNumber,
            },
            property: {
                id: (invoice as any).lease.unit.property.id,
                name: (invoice as any).lease.unit.property.name,
            },
        }));
    }

    // 🆕 النشاط الأخير
    async getRecentActivity(ownerId: number, limit: number = 10) {
        const activities: { type: string; message: string; date: Date; data?: any }[] = [];

        // آخر المدفوعات
        const recentPayments = await Payment.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: Invoice,
                    as: 'invoice',
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
                    ],
                },
            ],
        });

        recentPayments.filter((p) => (p as any).invoice?.lease?.unit?.property).forEach((payment) => {
            const tenantName = (payment as any).invoice?.lease?.tenant?.name || 'مستأجر';
            activities.push({
                type: 'payment',
                message: `تم دفع ${payment.amount} ج.م من ${tenantName}`,
                date: payment.createdAt,
                data: { paymentId: payment.id },
            });
        });

        // آخر المصروفات
        const recentExpenses = await Expense.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: Property,
                    as: 'property',
                    where: { ownerId },
                },
            ],
        });

        recentExpenses.forEach((expense) => {
            activities.push({
                type: 'expense',
                message: `تم إضافة مصروف ${expense.category}: ${expense.amount} ج.م`,
                date: expense.createdAt,
                data: { expenseId: expense.id },
            });
        });

        // آخر العقود
        const recentLeases = await Lease.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
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

        recentLeases.filter((l) => (l as any).unit?.property).forEach((lease) => {
            const tenantName = (lease as any).tenant?.name || 'مستأجر';
            const unitNumber = (lease as any).unit?.unitNumber || '';
            activities.push({
                type: 'lease',
                message: `تم تسجيل عقد جديد لـ ${tenantName} في وحدة ${unitNumber}`,
                date: lease.createdAt,
                data: { leaseId: lease.id },
            });
        });

        // ترتيب حسب التاريخ
        return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit);
    }
}

export const dashboardService = new DashboardService();

