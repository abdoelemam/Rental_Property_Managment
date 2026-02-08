import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

export enum PropertyType {
    RESIDENTIAL = 'residential',
    COMMERCIAL = 'commercial',
    MIXED = 'mixed',
}

export interface PropertyAttributes {
    id: number;
    name: string;
    address: string;
    city: string;
    type: PropertyType;
    totalUnits: number;
    description?: string;
    images?: string; // JSON array of image paths
    ownerId: number;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface PropertyCreationAttributes extends Optional<PropertyAttributes, 'id' | 'isActive' | 'totalUnits' | 'createdAt' | 'updatedAt'> { }

class Property extends Model<PropertyAttributes, PropertyCreationAttributes> implements PropertyAttributes {
    public id!: number;
    public name!: string;
    public address!: string;
    public city!: string;
    public type!: PropertyType;
    public totalUnits!: number;
    public description?: string;
    public images?: string;
    public ownerId!: number;
    public isActive!: boolean;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Property.init(
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
        address: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        city: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM(...Object.values(PropertyType)),
            allowNull: false,
            defaultValue: PropertyType.RESIDENTIAL,
        },
        totalUnits: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        images: {
            type: DataTypes.TEXT, // JSON array
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
        tableName: 'properties',
        timestamps: true,
        indexes: [
            { fields: ['ownerId'] },
            { fields: ['city'] },
        ],
    }
);

export default Property;
