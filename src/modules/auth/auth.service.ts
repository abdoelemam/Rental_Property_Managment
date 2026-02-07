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

        const token = this.generateToken(user);

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            token,
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

        const token = this.generateToken(user);

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            token,
        };
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

    // توليد JWT Token
    private generateToken(user: User): string {
        const payload = { id: user.id, email: user.email, role: user.role };
        const secret = process.env.JWT_SECRET || 'your-secret-key';
        const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

        return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
    }
}

export const authService = new AuthService();
