import nodemailer from 'nodemailer';

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }

    async send(options: EmailOptions): Promise<boolean> {
        try {
            await this.transporter.sendMail({
                from: `"Property Management" <${process.env.EMAIL_USER}>`,
                to: options.to,
                subject: options.subject,
                html: options.html,
            });
            console.log(`✅ Email sent to ${options.to}`);
            return true;
        } catch (error) {
            console.error('❌ Email Error:', error);
            return false;
        }
    }

    // إشعار فاتورة جديدة
    async sendInvoiceNotification(tenantEmail: string, tenantName: string, amount: number, dueDate: string) {
        return this.send({
            to: tenantEmail,
            subject: '🧾 فاتورة جديدة - إدارة العقارات',
            html: `
                <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="color: #2563eb;">فاتورة جديدة</h2>
                    <p>مرحباً ${tenantName}،</p>
                    <p>تم إصدار فاتورة جديدة بقيمة <strong>${amount} ج.م</strong></p>
                    <p>تاريخ الاستحقاق: <strong>${dueDate}</strong></p>
                    <p>يرجى السداد في الموعد المحدد.</p>
                    <hr>
                    <p style="color: #666;">نظام إدارة العقارات</p>
                </div>
            `,
        });
    }

    // إشعار تأخر السداد
    async sendOverdueNotification(tenantEmail: string, tenantName: string, amount: number, daysOverdue: number) {
        return this.send({
            to: tenantEmail,
            subject: '⚠️ تنبيه: فاتورة متأخرة - إدارة العقارات',
            html: `
                <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="color: #dc2626;">تنبيه: فاتورة متأخرة</h2>
                    <p>مرحباً ${tenantName}،</p>
                    <p>لديك فاتورة متأخرة بقيمة <strong>${amount} ج.م</strong></p>
                    <p>عدد أيام التأخير: <strong>${daysOverdue} يوم</strong></p>
                    <p>يرجى السداد في أقرب وقت ممكن لتجنب أي إجراءات إضافية.</p>
                    <hr>
                    <p style="color: #666;">نظام إدارة العقارات</p>
                </div>
            `,
        });
    }

    // إشعار انتهاء العقد
    async sendLeaseExpiryNotification(tenantEmail: string, tenantName: string, endDate: string, daysRemaining: number) {
        return this.send({
            to: tenantEmail,
            subject: '📋 تذكير: عقدك يقترب من الانتهاء',
            html: `
                <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="color: #f59e0b;">تذكير بانتهاء العقد</h2>
                    <p>مرحباً ${tenantName}،</p>
                    <p>نود تذكيرك بأن عقدك سينتهي في <strong>${endDate}</strong></p>
                    <p>متبقي: <strong>${daysRemaining} يوم</strong></p>
                    <p>يرجى التواصل معنا للتجديد أو أي استفسارات.</p>
                    <hr>
                    <p style="color: #666;">نظام إدارة العقارات</p>
                </div>
            `,
        });
    }

    // تأكيد الدفع
    async sendPaymentConfirmation(tenantEmail: string, tenantName: string, amount: number, paymentDate: string) {
        return this.send({
            to: tenantEmail,
            subject: '✅ تأكيد استلام الدفعة',
            html: `
                <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="color: #16a34a;">تم استلام الدفعة بنجاح</h2>
                    <p>مرحباً ${tenantName}،</p>
                    <p>تم استلام دفعتك بقيمة <strong>${amount} ج.م</strong></p>
                    <p>تاريخ الدفع: <strong>${paymentDate}</strong></p>
                    <p>شكراً لك!</p>
                    <hr>
                    <p style="color: #666;">نظام إدارة العقارات</p>
                </div>
            `,
        });
    }
}

export const emailService = new EmailService();
