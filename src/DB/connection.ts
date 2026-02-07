import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const sslCertPath = path.join(__dirname, '../../isrgrootx1.pem');

export const sequelize = new Sequelize(
    process.env.DB_NAME || 'property_management',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '4000'),
        dialect: 'mysql',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        dialectOptions: {
            ssl: {
                minVersion: 'TLSv1.2',
                ca: fs.existsSync(sslCertPath) ? fs.readFileSync(sslCertPath) : undefined,
                rejectUnauthorized: true,
            },
        },
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
    }
);

export const connectDB = async (): Promise<void> => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected successfully (TiDB)');

        // Sync models
        await sequelize.sync();
        console.log('✅ Database synced');
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    }
};
