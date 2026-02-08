import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// إنشاء مجلدات التخزين
const uploadDirs = ['uploads', 'uploads/users', 'uploads/properties', 'uploads/units'];
uploadDirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
    }
});

// إعدادات التخزين
const storage = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb) => {
        let uploadPath = 'uploads/';

        // تحديد المسار حسب الـ URL
        const fullUrl = req.baseUrl + req.path;
        if (fullUrl.includes('/user/') || fullUrl.includes('/users/')) {
            uploadPath = 'uploads/users/';
        } else if (fullUrl.includes('/property/') || fullUrl.includes('/properties/')) {
            uploadPath = 'uploads/properties/';
        } else if (fullUrl.includes('/unit/') || fullUrl.includes('/units/')) {
            uploadPath = 'uploads/units/';
        }

        cb(null, uploadPath);
    },
    filename: (req: Request, file: Express.Multer.File, cb) => {
        // اسم فريد: timestamp-random-originalname
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    }
});

// فلترة الملفات (صور فقط)
const imageFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = allowedTypes.test(file.mimetype);

    if (extName && mimeType) {
        cb(null, true);
    } else {
        cb(new Error('فقط الصور مسموح بها (jpeg, jpg, png, gif, webp)'));
    }
};

// إعداد multer للصور
export const uploadImage = multer({
    storage,
    fileFilter: imageFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
    }
});

// Single image upload (for 'image' field)
export const uploadSingle = uploadImage.single('image');

// Avatar upload (for 'avatar' field)
export const uploadAvatar = uploadImage.single('avatar');

// Multiple images upload (max 5)
export const uploadMultiple = uploadImage.array('images', 5);

// Helper: الحصول على URL للصورة
export const getImageUrl = (filename: string, folder: string): string => {
    return `/uploads/${folder}/${filename}`;
};

// Helper: حذف صورة
export const deleteImage = (imagePath: string): void => {
    const fullPath = path.join(process.cwd(), imagePath);
    if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
    }
};
