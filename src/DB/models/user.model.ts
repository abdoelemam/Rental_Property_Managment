import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

export enum UserRole {
    ADMIN = 'admin',
    OWNER = 'owner',
    ACCOUNTANT = 'accountant',
    VIEWER = 'viewer',
}

export interface UserAttributes {
    id: number;
    name: string;
    email: string;
    password: string;
    phone?: string;
    role: UserRole;
    parentId?: number; // للمستخدمين اللي أضافهم الـ Owner
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'isActive' | 'createdAt' | 'updatedAt'> { }

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    public id!: number;
    public name!: string;
    public email!: string;
    public password!: string;
    public phone?: string;
    public role!: UserRole;
    public parentId?: number;
    public isActive!: boolean;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

User.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        role: {
            type: DataTypes.ENUM(...Object.values(UserRole)),
            allowNull: false,
            defaultValue: UserRole.OWNER,
        },
        parentId: {
            type: DataTypes.INTEGER,
            allowNull: true,
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
        tableName: 'users',
        timestamps: true,
        indexes: [
            { fields: ['email'] },
            { fields: ['parentId'] },
        ],
    }
);

export default User;
