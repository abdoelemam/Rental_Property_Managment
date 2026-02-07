import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

export interface TenantAttributes {
    id: number;
    name: string;
    phone: string;
    email?: string;
    idNumber?: string; // رقم البطاقة/الهوية
    idType?: string; // نوع الهوية (بطاقة، جواز سفر، إقامة)
    nationality?: string;
    occupation?: string; // المهنة
    emergencyContact?: string; // رقم الطوارئ
    emergencyContactName?: string;
    address?: string; // عنوان سابق
    notes?: string;
    ownerId: number; // المالك اللي أضاف المستأجر
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface TenantCreationAttributes extends Optional<TenantAttributes, 'id' | 'isActive' | 'createdAt' | 'updatedAt'> { }

class Tenant extends Model<TenantAttributes, TenantCreationAttributes> implements TenantAttributes {
    public id!: number;
    public name!: string;
    public phone!: string;
    public email?: string;
    public idNumber?: string;
    public idType?: string;
    public nationality?: string;
    public occupation?: string;
    public emergencyContact?: string;
    public emergencyContactName?: string;
    public address?: string;
    public notes?: string;
    public ownerId!: number;
    public isActive!: boolean;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Tenant.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(150),
            allowNull: false,
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: true,
            validate: {
                isEmail: true,
            },
        },
        idNumber: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        idType: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        nationality: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        occupation: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        emergencyContact: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        emergencyContactName: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        address: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        ownerId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    },
    {
        sequelize,
        tableName: 'tenants',
        timestamps: true,
        indexes: [
            { fields: ['ownerId'] },
            { fields: ['phone'] },
            { fields: ['idNumber'] },
        ],
    }
);

export default Tenant;
