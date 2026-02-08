import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import tenantsRoutes from './modules/tenants/tenants.routes';
import propertiesRoutes from './modules/properties/properties.routes';
import unitsRoutes from './modules/units/units.routes';
import leasesRoutes from './modules/leases/leases.routes';
import invoicesRoutes from './modules/invoices/invoices.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import expensesRoutes from './modules/expenses/expenses.routes';
import reportsRoutes from './modules/reports/reports.routes';
import uploadRoutes from './modules/upload/upload.routes';
import uploadS3Routes from './modules/upload/upload-s3.routes';

// Import models to initialize associations
import './DB/models';

// Import Swagger config
import { swaggerSpec } from './config/swagger.config';

const app: Application = express();

// ============================================
// Middlewares
// ============================================

// Security - Helmet
app.use(helmet());

// CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
}));

// Rate Limiting - 100 requests per 15 minutes
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'عدد الطلبات تجاوز الحد المسموح، حاول مرة أخرى بعد 15 دقيقة',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Parse JSON
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ============================================
// API Routes
// ============================================

const API_PREFIX = '/api/v1';

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, usersRoutes);
app.use(`${API_PREFIX}/tenants`, tenantsRoutes);
app.use(`${API_PREFIX}/properties`, propertiesRoutes);
app.use(`${API_PREFIX}/units`, unitsRoutes);
app.use(`${API_PREFIX}/leases`, leasesRoutes);
app.use(`${API_PREFIX}/invoices`, invoicesRoutes);
app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);
app.use(`${API_PREFIX}/expenses`, expensesRoutes);
app.use(`${API_PREFIX}/reports`, reportsRoutes);
app.use(`${API_PREFIX}/upload`, uploadRoutes);      // Local storage
app.use(`${API_PREFIX}/upload-s3`, uploadS3Routes); // AWS S3 storage

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Property Management API Docs',
}));

// Swagger JSON export (for Postman import)
app.get('/api-docs.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// ============================================
// Health Check
// ============================================

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
    });
});

// ============================================
// 404 Handler
// ============================================

// 404 Handler - يجب أن يكون آخر route
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
});

// ============================================
// Global Error Handler
// ============================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err);

    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'development' ? err.message : 'خطأ في الخادم',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

export default app;
