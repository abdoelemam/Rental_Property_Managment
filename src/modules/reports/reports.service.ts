import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { Response } from 'express';
import { Op } from 'sequelize';
import { Property, Unit, Lease, Invoice, Payment, Expense, Tenant } from '../../DB/models';

export class ReportsService {
    // تقرير الإيرادات والمصروفات
    async generateFinancialReport(ownerId: number, year: number, month: number, format: 'pdf' | 'excel', res: Response) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        // جلب البيانات
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
                                },
                            ],
                        },
                    ],
                },
            ],
        });

        const expenses = await Expense.findAll({
            where: {
                expenseDate: { [Op.between]: [startDate, endDate] },
            },
            include: [
                {
                    model: Property,
                    as: 'property',
                    where: { ownerId },
                },
            ],
        });

        const filteredInvoices = invoices.filter((inv) => (inv as any).lease?.unit?.property);
        const totalIncome = filteredInvoices.reduce((sum, inv) => sum + Number(inv.paidAmount), 0);
        const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

        if (format === 'pdf') {
            return this.generateFinancialPDF(res, { year, month, totalIncome, totalExpenses, invoices: filteredInvoices, expenses });
        } else {
            return this.generateFinancialExcel(res, { year, month, totalIncome, totalExpenses, invoices: filteredInvoices, expenses });
        }
    }

    // تقرير العقارات
    async generatePropertiesReport(ownerId: number, format: 'pdf' | 'excel', res: Response) {
        const properties = await Property.findAll({
            where: { ownerId, isActive: true },
            include: [
                {
                    model: Unit,
                    as: 'units',
                },
            ],
        });

        if (format === 'pdf') {
            return this.generatePropertiesPDF(res, properties);
        } else {
            return this.generatePropertiesExcel(res, properties);
        }
    }

    // تقرير المستأجرين
    async generateTenantsReport(ownerId: number, format: 'pdf' | 'excel', res: Response) {
        const tenants = await Tenant.findAll({
            where: { ownerId, isActive: true },
            include: [
                {
                    model: Lease,
                    as: 'leases',
                    include: [
                        {
                            model: Unit,
                            as: 'unit',
                            include: [{ model: Property, as: 'property' }],
                        },
                    ],
                },
            ],
        });

        if (format === 'pdf') {
            return this.generateTenantsPDF(res, tenants);
        } else {
            return this.generateTenantsExcel(res, tenants);
        }
    }

    // ============ PDF Generators ============

    private generateFinancialPDF(res: Response, data: any) {
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=financial-report-${data.year}-${data.month}.pdf`);
        doc.pipe(res);

        doc.fontSize(20).text('التقرير المالي', { align: 'center' });
        doc.moveDown();
        doc.fontSize(14).text(`الفترة: ${data.month}/${data.year}`);
        doc.moveDown();
        doc.text(`إجمالي الإيرادات: ${data.totalIncome} ج.م`);
        doc.text(`إجمالي المصروفات: ${data.totalExpenses} ج.م`);
        doc.text(`صافي الربح: ${data.totalIncome - data.totalExpenses} ج.م`);
        doc.moveDown();
        doc.text(`عدد الفواتير: ${data.invoices.length}`);
        doc.text(`عدد المصروفات: ${data.expenses.length}`);

        doc.end();
    }

    private generatePropertiesPDF(res: Response, properties: any[]) {
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=properties-report.pdf');
        doc.pipe(res);

        doc.fontSize(20).text('تقرير العقارات', { align: 'center' });
        doc.moveDown();
        doc.fontSize(14).text(`إجمالي العقارات: ${properties.length}`);
        doc.moveDown();

        properties.forEach((prop, index) => {
            doc.text(`${index + 1}. ${prop.name} - ${prop.city}`);
            doc.text(`   عدد الوحدات: ${prop.units?.length || 0}`);
            doc.moveDown(0.5);
        });

        doc.end();
    }

    private generateTenantsPDF(res: Response, tenants: any[]) {
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=tenants-report.pdf');
        doc.pipe(res);

        doc.fontSize(20).text('تقرير المستأجرين', { align: 'center' });
        doc.moveDown();
        doc.fontSize(14).text(`إجمالي المستأجرين: ${tenants.length}`);
        doc.moveDown();

        tenants.forEach((tenant, index) => {
            doc.text(`${index + 1}. ${tenant.name} - ${tenant.phone}`);
            doc.text(`   البريد: ${tenant.email || 'غير متوفر'}`);
            doc.moveDown(0.5);
        });

        doc.end();
    }

    // ============ Excel Generators ============

    private async generateFinancialExcel(res: Response, data: any) {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('التقرير المالي');

        sheet.columns = [
            { header: 'البيان', key: 'label', width: 30 },
            { header: 'القيمة', key: 'value', width: 20 },
        ];

        sheet.addRow({ label: 'الفترة', value: `${data.month}/${data.year}` });
        sheet.addRow({ label: 'إجمالي الإيرادات', value: data.totalIncome });
        sheet.addRow({ label: 'إجمالي المصروفات', value: data.totalExpenses });
        sheet.addRow({ label: 'صافي الربح', value: data.totalIncome - data.totalExpenses });
        sheet.addRow({ label: 'عدد الفواتير', value: data.invoices.length });
        sheet.addRow({ label: 'عدد المصروفات', value: data.expenses.length });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=financial-report-${data.year}-${data.month}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    }

    private async generatePropertiesExcel(res: Response, properties: any[]) {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('العقارات');

        sheet.columns = [
            { header: '#', key: 'index', width: 5 },
            { header: 'اسم العقار', key: 'name', width: 25 },
            { header: 'النوع', key: 'type', width: 15 },
            { header: 'المدينة', key: 'city', width: 15 },
            { header: 'عدد الوحدات', key: 'units', width: 12 },
        ];

        properties.forEach((prop, index) => {
            sheet.addRow({
                index: index + 1,
                name: prop.name,
                type: prop.type,
                city: prop.city,
                units: prop.units?.length || 0,
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=properties-report.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    }

    private async generateTenantsExcel(res: Response, tenants: any[]) {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('المستأجرين');

        sheet.columns = [
            { header: '#', key: 'index', width: 5 },
            { header: 'الاسم', key: 'name', width: 25 },
            { header: 'الهاتف', key: 'phone', width: 15 },
            { header: 'البريد', key: 'email', width: 25 },
        ];

        tenants.forEach((tenant, index) => {
            sheet.addRow({
                index: index + 1,
                name: tenant.name,
                phone: tenant.phone,
                email: tenant.email || '',
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=tenants-report.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    }
}

export const reportsService = new ReportsService();
