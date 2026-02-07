import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

export enum PaymentMethod {
    CASH = 'cash',
    BANK_TRANSFER = 'bank_transfer',
    CHECK = 'check',
    CARD = 'card',
    OTHER = 'other',
}

export interface PaymentAttributes {
    id: number;
    invoiceId: number;
    amount: number;
    paymentDate: Date;
    paymentMethod: PaymentMethod;
    referenceNumber?: string; // رقم الحوالة أو الشيك
    notes?: string;
    createdById: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface PaymentCreationAttributes extends Optional<PaymentAttributes, 'id' | 'createdAt' | 'updatedAt'> { }

class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
    public id!: number;
    public invoiceId!: number;
    public amount!: number;
    public paymentDate!: Date;
    public paymentMethod!: PaymentMethod;
    public referenceNumber?: string;
    public notes?: string;
    public createdById!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Payment.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        invoiceId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'invoices',
                key: 'id',
            },
        },
        amount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
        },
        paymentDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        paymentMethod: {
            type: DataTypes.ENUM(...Object.values(PaymentMethod)),
            allowNull: false,
            defaultValue: PaymentMethod.CASH,
        },
        referenceNumber: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        createdById: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
    },
    {
        sequelize,
        tableName: 'payments',
        timestamps: true,
        indexes: [
            { fields: ['invoiceId'] },
            { fields: ['paymentDate'] },
            { fields: ['createdById'] },
        ],
    }
);

export default Payment;
