import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Property Management API',
            version: '1.0.0',
            description: 'نظام إدارة العقارات - API Documentation',
            contact: {
                name: 'Support',
                email: 'support@property-management.com',
            },
        },
        servers: [
            {
                url: 'http://localhost:3000/api/v1',
                description: 'Development Server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [{ bearerAuth: [] }],
        tags: [
            { name: 'Auth', description: 'التسجيل وتسجيل الدخول' },
            { name: 'Users', description: 'إدارة المستخدمين' },
            { name: 'Properties', description: 'إدارة العقارات' },
            { name: 'Units', description: 'إدارة الوحدات' },
            { name: 'Tenants', description: 'إدارة المستأجرين' },
            { name: 'Leases', description: 'إدارة العقود' },
            { name: 'Invoices', description: 'إدارة الفواتير' },
            { name: 'Expenses', description: 'إدارة المصروفات' },
            { name: 'Dashboard', description: 'لوحة التحكم والإحصائيات' },
        ],
        paths: {
            // Auth
            '/auth/register': {
                post: {
                    tags: ['Auth'],
                    summary: 'تسجيل مستخدم جديد',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['name', 'email', 'password', 'phone'],
                                    properties: {
                                        name: { type: 'string', example: 'أحمد محمد' },
                                        email: { type: 'string', example: 'ahmed@example.com' },
                                        password: { type: 'string', example: 'password123' },
                                        phone: { type: 'string', example: '01234567890' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: { description: 'تم التسجيل بنجاح' },
                        400: { description: 'بيانات غير صالحة' },
                    },
                },
            },
            '/auth/login': {
                post: {
                    tags: ['Auth'],
                    summary: 'تسجيل الدخول',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['email', 'password'],
                                    properties: {
                                        email: { type: 'string', example: 'ahmed@example.com' },
                                        password: { type: 'string', example: 'password123' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'تم تسجيل الدخول بنجاح' },
                        401: { description: 'بيانات غير صحيحة' },
                    },
                },
            },
            // Properties
            '/properties': {
                get: {
                    tags: ['Properties'],
                    summary: 'جلب جميع العقارات',
                    security: [{ bearerAuth: [] }],
                    responses: { 200: { description: 'قائمة العقارات' } },
                },
                post: {
                    tags: ['Properties'],
                    summary: 'إضافة عقار جديد',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['name', 'type', 'address', 'city'],
                                    properties: {
                                        name: { type: 'string', example: 'برج الإمام' },
                                        type: { type: 'string', enum: ['residential', 'commercial', 'mixed'], example: 'residential' },
                                        address: { type: 'string', example: 'شارع النيل' },
                                        city: { type: 'string', example: 'القاهرة' },
                                    },
                                },
                            },
                        },
                    },
                    responses: { 201: { description: 'تم إضافة العقار' } },
                },
            },
            // Dashboard
            '/dashboard/overview': {
                get: {
                    tags: ['Dashboard'],
                    summary: 'الإحصائيات العامة',
                    security: [{ bearerAuth: [] }],
                    responses: { 200: { description: 'إحصائيات عامة' } },
                },
            },
            '/dashboard/financial': {
                get: {
                    tags: ['Dashboard'],
                    summary: 'الإحصائيات المالية',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: 'year', in: 'query', schema: { type: 'integer' } },
                        { name: 'month', in: 'query', schema: { type: 'integer' } },
                    ],
                    responses: { 200: { description: 'إحصائيات مالية' } },
                },
            },
        },
    },
    apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
