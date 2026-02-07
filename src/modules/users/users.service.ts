import bcrypt from 'bcryptjs';
import { User, UserRole } from '../../DB/models';
import { CreateUserInput, UpdateUserInput } from './users.validation';

export class UsersService {
    // إضافة عضو فريق جديد (Accountant أو Viewer)
    async createTeamMember(ownerId: number, data: CreateUserInput) {
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
            role: data.role as UserRole,
            parentId: ownerId,
        });

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            isActive: user.isActive,
            createdAt: user.createdAt,
        };
    }

    // جلب أعضاء الفريق للـ Owner
    async getTeamMembers(ownerId: number) {
        const members = await User.findAll({
            where: { parentId: ownerId },
            attributes: { exclude: ['password'] },
            order: [['createdAt', 'DESC']],
        });

        return members;
    }

    // جلب عضو فريق بالـ ID
    async getTeamMemberById(ownerId: number, memberId: number) {
        const member = await User.findOne({
            where: { id: memberId, parentId: ownerId },
            attributes: { exclude: ['password'] },
        });

        if (!member) {
            throw { status: 404, message: 'العضو غير موجود' };
        }

        return member;
    }

    // تعديل بيانات عضو فريق
    async updateTeamMember(ownerId: number, memberId: number, data: UpdateUserInput) {
        const member = await User.findOne({
            where: { id: memberId, parentId: ownerId },
        });

        if (!member) {
            throw { status: 404, message: 'العضو غير موجود' };
        }

        const updateData: any = { ...data };
        if (data.role) {
            updateData.role = data.role as UserRole;
        }
        await member.update(updateData);

        return {
            id: member.id,
            name: member.name,
            email: member.email,
            role: member.role,
            phone: member.phone,
            isActive: member.isActive,
            updatedAt: member.updatedAt,
        };
    }

    // حذف عضو فريق
    async deleteTeamMember(ownerId: number, memberId: number) {
        const member = await User.findOne({
            where: { id: memberId, parentId: ownerId },
        });

        if (!member) {
            throw { status: 404, message: 'العضو غير موجود' };
        }

        await member.destroy();

        return { message: 'تم حذف العضو بنجاح' };
    }

    // تفعيل/إلغاء تفعيل عضو
    async toggleMemberStatus(ownerId: number, memberId: number) {
        const member = await User.findOne({
            where: { id: memberId, parentId: ownerId },
        });

        if (!member) {
            throw { status: 404, message: 'العضو غير موجود' };
        }

        await member.update({ isActive: !member.isActive });

        return {
            id: member.id,
            isActive: member.isActive,
            message: member.isActive ? 'تم تفعيل العضو' : 'تم إلغاء تفعيل العضو',
        };
    }
}

export const usersService = new UsersService();
