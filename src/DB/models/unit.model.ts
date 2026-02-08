import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

export enum UnitStatus {
    VACANT = 'vacant',
    OCCUPIED = 'occupied',
    MAINTENANCE = 'maintenance',
}

export interface UnitAttributes {
    id: number;
    unitNumber: string;
    propertyId: number;
    floor?: number;
    bedrooms?: number;
    bathrooms?: number;
    area?: number;
    monthlyRent: number;
    status: UnitStatus;
    description?: string;
    images?: string; // JSON array of image paths
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface UnitCreationAttributes extends Optional<UnitAttributes, 'id' | 'isActive' | 'status' | 'createdAt' | 'updatedAt'> { }

class Unit extends Model<UnitAttributes, UnitCreationAttributes> implements UnitAttributes {
    public id!: number;
    public unitNumber!: string;
    public propertyId!: number;
    public floor?: number;
    public bedrooms?: number;
    public bathrooms?: number;
    public area?: number;
    public monthlyRent!: number;
    public status!: UnitStatus;
    public description?: string;
    public images?: string;
    public isActive!: boolean;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Unit.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        unitNumber: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        propertyId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'properties',
                key: 'id',
            },
        },
        floor: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        bedrooms: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        bathrooms: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        area: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        monthlyRent: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM(...Object.values(UnitStatus)),
            allowNull: false,
            defaultValue: UnitStatus.VACANT,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        images: {
            type: DataTypes.TEXT, // JSON array
            allowNull: true,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    },
    {
        sequelize,
        tableName: 'units',
        timestamps: true,
        indexes: [
            { fields: ['propertyId'] },
            { fields: ['status'] },
            { unique: true, fields: ['propertyId', 'unitNumber'] },
        ],
    }
);

export default Unit;
