import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
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

// Import models to initialize associations
import './DB/models';

const app: Application = express();

// ============================================
// Middlewares
// ============================================

// CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
}));

// Parse JSON
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded
app.use(express.urlencoded({ extended: true }));

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
