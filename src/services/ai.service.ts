import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing. Check your env variables.");
}

const genAI = new GoogleGenerativeAI(apiKey);

export class AIService {
    private model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    async analyzePropertyData(data: {
        totalIncome: number;
        totalExpenses: number;
        occupancyRate: number;
        overduePayments: number;
    }): Promise<string> {
        const prompt = `
كخبير في إدارة العقارات، حلل البيانات التالية وقدم توصيات:
- إجمالي الدخل: ${data.totalIncome} ريال
- إجمالي المصروفات: ${data.totalExpenses} ريال
- نسبة الإشغال: ${data.occupancyRate}%
- المدفوعات المتأخرة: ${data.overduePayments} ريال

قدم توصيات موجزة لتحسين الأداء المالي.
`;

        try {
            const result = await this.model.generateContent(prompt);
            return result.response.text();
        } catch (error: any) {
            // اطبع تفاصيل مفيدة بدل "AI Error" بس
            console.error("AI Error:", {
                message: error?.message,
                status: error?.status,
                code: error?.code,
                details: error?.details,
            });
            return "عذراً، لم نتمكن من تحليل البيانات حالياً.";
        }
    }
}

export const aiService = new AIService();
