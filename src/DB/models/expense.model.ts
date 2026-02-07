import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

export enum ExpenseCategory {
    MAINTENANCE = 'maintenance',
    UTILITIES = 'utilities',
    REPAIRS = 'repairs',
    INSURANCE = 'insurance',
    TAXES = 'taxes',
    MANAGEMENT = 'management',
    OTHER = 'other',
}

export interface ExpenseAttributes {
    id: number;
    propertyId: number;
    unitId?: number; // لو المصروف خاص بوحدة معينة
    category: ExpenseCategory;
    amount: number;
    expenseDate: Date;
    description: string;
    vendor?: string;
    receiptNumber?: string;
    createdById: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ExpenseCreationAttributes extends Optional<ExpenseAttributes, 'id' | 'createdAt' | 'updatedAt'> { }

class Expense extends Model<ExpenseAttributes, ExpenseCreationAttributes> implements ExpenseAttributes {
    public id!: number;
    public propertyId!: number;
    public unitId?: number;
    public category!: ExpenseCategory;
    public amount!: number;
    public expenseDate!: Date;
    public description!: string;
    public vendor?: string;
    public receiptNumber?: string;
    public createdById!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Expense.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        propertyId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'properties',
                key: 'id',
            },
        },
        unitId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'units',
                key: 'id',
            },
        },
        category: {
            type: DataTypes.ENUM(...Object.values(ExpenseCategory)),
            allowNull: false,
        },
        amount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
        },
        expenseDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        description: {
            type: DataTypes.STRING(500),
            allowNull: false,
        },
        vendor: {
            type: DataTypes.STRING(150),
            allowNull: true,
        },
        receiptNumber: {
            type: DataTypes.STRING(100),
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
        tableName: 'expenses',
        timestamps: true,
        indexes: [
            { fields: ['propertyId'] },
            { fields: ['unitId'] },
            { fields: ['category'] },
            { fields: ['expenseDate'] },
        ],
    }
);

export default Expense;
