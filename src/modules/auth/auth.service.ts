import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../../DB/models';
import { RegisterInput, LoginInput, ChangePasswordInput } from './auth.validation';

export class AuthService {
    // تسجيل مستخدم جديد (Owner فقط)
    async register(data: RegisterInput) {
        const existingUser = await User.findOne({ where: { email: data.email } });

        if (existingUser) {
            throw { status: 400, message: 'البريد الإلكتروني مستخدم بالفعل' };
        }

        const hashedPassword = await bcrypt.hash(data.password, 12);

        const user = await User.create({
            name: data.name,
            email: data.email,
            password: hashedPassword,
            phone: data.phone,
            role: UserRole.OWNER,
        });

        const tokens = this.generateTokens(user);

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            ...tokens,
        };
    }

    // تسجيل الدخول
    async login(data: LoginInput) {
        const user = await User.findOne({ where: { email: data.email } });

        if (!user) {
            throw { status: 401, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
        }

        if (!user.isActive) {
            throw { status: 403, message: 'الحساب غير نشط' };
        }

        const isValidPassword = await bcrypt.compare(data.password, user.password);

        if (!isValidPassword) {
            throw { status: 401, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
        }

        const tokens = this.generateTokens(user);

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            ...tokens,
        };
    }

    // تجديد الـ Access Token
    async refreshToken(refreshToken: string) {
        try {
            const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'refresh-secret';
            const decoded = jwt.verify(refreshToken, secret) as { id: number; email: string; role: string };

            const user = await User.findByPk(decoded.id);

            if (!user || !user.isActive) {
                throw { status: 401, message: 'Token غير صالح' };
            }

            const tokens = this.generateTokens(user);

            return {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
                ...tokens,
            };
        } catch (error) {
            throw { status: 401, message: 'Refresh Token غير صالح أو منتهي' };
        }
    }

    // تغيير كلمة المرور
    async changePassword(userId: number, data: ChangePasswordInput) {
        const user = await User.findByPk(userId);

        if (!user) {
            throw { status: 404, message: 'المستخدم غير موجود' };
        }

        const isValidPassword = await bcrypt.compare(data.currentPassword, user.password);

        if (!isValidPassword) {
            throw { status: 401, message: 'كلمة المرور الحالية غير صحيحة' };
        }

        const hashedPassword = await bcrypt.hash(data.newPassword, 12);
        await user.update({ password: hashedPassword });

        return { message: 'تم تغيير كلمة المرور بنجاح' };
    }

    // الحصول على بيانات المستخدم الحالي
    async getMe(userId: number) {
        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password'] },
        });

        if (!user) {
            throw { status: 404, message: 'المستخدم غير موجود' };
        }

        return user;
    }

    // توليد Access و Refresh Tokens
    private generateTokens(user: User): { accessToken: string; refreshToken: string } {
        const payload = { id: user.id, email: user.email, role: user.role };

        const accessSecret = process.env.JWT_SECRET || 'your-secret-key';
        const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'refresh-secret';

        const accessExpiresIn = process.env.JWT_EXPIRES_IN || '15m';
        const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

        const accessToken = jwt.sign(payload, accessSecret, { expiresIn: accessExpiresIn } as jwt.SignOptions);
        const refreshToken = jwt.sign(payload, refreshSecret, { expiresIn: refreshExpiresIn } as jwt.SignOptions);

        return { accessToken, refreshToken };
    }
}

export const authService = new AuthService();

