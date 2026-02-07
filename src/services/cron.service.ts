import cron from 'node-cron';
import { Op } from 'sequelize';
import { Lease, Invoice, LeaseStatus, InvoiceStatus } from '../DB/models';

export class CronService {
    // توليد الفواتير الشهرية
    private generateMonthlyInvoices = async (): Promise<void> => {
        console.log('🔄 بدء توليد الفواتير الشهرية...');

        try {
            const today = new Date();
            const currentDay = today.getDate();

            // جلب العقود النشطة اللي يوم دفعها هو اليوم
            const activeLeases = await Lease.findAll({
                where: {
                    status: LeaseStatus.ACTIVE,
                    paymentDay: currentDay,
                },
            });

            for (const lease of activeLeases) {
                // التحقق من عدم وجود فاتورة لنفس الشهر
                const existingInvoice = await Invoice.findOne({
                    where: {
                        leaseId: lease.id,
                        dueDate: {
                            [Op.gte]: new Date(today.getFullYear(), today.getMonth(), 1),
                            [Op.lt]: new Date(today.getFullYear(), today.getMonth() + 1, 1),
                        },
                    },
                });

                if (!existingInvoice) {
                    const invoiceNumber = `INV-${Date.now()}-${lease.id}`;

                    await Invoice.create({
                        invoiceNumber,
                        leaseId: lease.id,
                        amount: Number(lease.monthlyRent),
                        dueDate: today,
                        description: `إيجار شهر ${today.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}`,
                    });

                    console.log(`✅ تم إنشاء فاتورة للعقد: ${lease.id}`);
                }
            }

            console.log('✅ انتهى توليد الفواتير الشهرية');
        } catch (error) {
            console.error('❌ خطأ في توليد الفواتير:', error);
        }
    };

    // تحديث حالة الفواتير المتأخرة
    private updateOverdueInvoices = async (): Promise<void> => {
        console.log('🔄 تحديث الفواتير المتأخرة...');

        try {
            const today = new Date();

            await Invoice.update(
                { status: InvoiceStatus.OVERDUE },
                {
                    where: {
                        status: InvoiceStatus.PENDING,
                        dueDate: { [Op.lt]: today },
                    },
                }
            );

            console.log('✅ تم تحديث الفواتير المتأخرة');
        } catch (error) {
            console.error('❌ خطأ في تحديث الفواتير:', error);
        }
    };

    // تحديث حالة العقود المنتهية
    private updateExpiredLeases = async (): Promise<void> => {
        console.log('🔄 تحديث العقود المنتهية...');

        try {
            const today = new Date();

            await Lease.update(
                { status: LeaseStatus.EXPIRED },
                {
                    where: {
                        status: LeaseStatus.ACTIVE,
                        endDate: { [Op.lt]: today },
                    },
                }
            );

            console.log('✅ تم تحديث العقود المنتهية');
        } catch (error) {
            console.error('❌ خطأ في تحديث العقود:', error);
        }
    };

    // بدء جميع الـ Cron Jobs
    start(): void {
        // توليد الفواتير يومياً الساعة 8 صباحاً
        cron.schedule('0 8 * * *', this.generateMonthlyInvoices);

        // تحديث الفواتير المتأخرة يومياً الساعة 9 صباحاً
        cron.schedule('0 9 * * *', this.updateOverdueInvoices);

        // تحديث العقود المنتهية يومياً الساعة 7 صباحاً
        cron.schedule('0 7 * * *', this.updateExpiredLeases);

        console.log('✅ Cron Jobs started');
    }
}

export const cronService = new CronService();
