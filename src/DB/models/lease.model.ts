import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

export enum LeaseStatus {
    ACTIVE = 'active',
    EXPIRED = 'expired',
    TERMINATED = 'terminated',
    PENDING = 'pending',
}

export enum PaymentFrequency {
    MONTHLY = 'monthly',
    QUARTERLY = 'quarterly',
    SEMI_ANNUAL = 'semi_annual',
    ANNUAL = 'annual',
}

export interface LeaseAttributes {
    id: number;
    unitId: number;
    tenantId: number; // ربط بالمستأجر
    startDate: Date;
    endDate: Date;
    monthlyRent: number;
    securityDeposit?: number;
    paymentFrequency: PaymentFrequency;
    paymentDay: number; // يوم الدفع في الشهر (1-28)
    status: LeaseStatus;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface LeaseCreationAttributes extends Optional<LeaseAttributes, 'id' | 'status' | 'createdAt' | 'updatedAt'> { }

class Lease extends Model<LeaseAttributes, LeaseCreationAttributes> implements LeaseAttributes {
    public id!: number;
    public unitId!: number;
    public tenantId!: number;
    public startDate!: Date;
    public endDate!: Date;
    public monthlyRent!: number;
    public securityDeposit?: number;
    public paymentFrequency!: PaymentFrequency;
    public paymentDay!: number;
    public status!: LeaseStatus;
    public notes?: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Lease.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        unitId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'units',
                key: 'id',
            },
        },
        tenantId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'tenants',
                key: 'id',
            },
        },
        startDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        endDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        monthlyRent: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
        },
        securityDeposit: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: true,
        },
        paymentFrequency: {
            type: DataTypes.ENUM(...Object.values(PaymentFrequency)),
            allowNull: false,
            defaultValue: PaymentFrequency.MONTHLY,
        },
        paymentDay: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            validate: {
                min: 1,
                max: 28,
            },
        },
        status: {
            type: DataTypes.ENUM(...Object.values(LeaseStatus)),
            allowNull: false,
            defaultValue: LeaseStatus.PENDING,
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'leases',
        timestamps: true,
        indexes: [
            { fields: ['unitId'] },
            { fields: ['tenantId'] },
            { fields: ['status'] },
            { fields: ['startDate', 'endDate'] },
        ],
    }
);

export default Lease;
