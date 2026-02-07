import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

export enum InvoiceStatus {
    PENDING = 'pending',
    PAID = 'paid',
    PARTIAL = 'partial',
    OVERDUE = 'overdue',
    CANCELLED = 'cancelled',
}

export interface InvoiceAttributes {
    id: number;
    invoiceNumber: string;
    leaseId: number;
    amount: number;
    paidAmount: number;
    dueDate: Date;
    status: InvoiceStatus;
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface InvoiceCreationAttributes extends Optional<InvoiceAttributes, 'id' | 'paidAmount' | 'status' | 'createdAt' | 'updatedAt'> { }

class Invoice extends Model<InvoiceAttributes, InvoiceCreationAttributes> implements InvoiceAttributes {
    public id!: number;
    public invoiceNumber!: string;
    public leaseId!: number;
    public amount!: number;
    public paidAmount!: number;
    public dueDate!: Date;
    public status!: InvoiceStatus;
    public description?: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Invoice.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        invoiceNumber: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
        },
        leaseId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'leases',
                key: 'id',
            },
        },
        amount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
        },
        paidAmount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
        },
        dueDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM(...Object.values(InvoiceStatus)),
            allowNull: false,
            defaultValue: InvoiceStatus.PENDING,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'invoices',
        timestamps: true,
        indexes: [
            { fields: ['leaseId'] },
            { fields: ['status'] },
            { fields: ['dueDate'] },
            { unique: true, fields: ['invoiceNumber'] },
        ],
    }
);

export default Invoice;
