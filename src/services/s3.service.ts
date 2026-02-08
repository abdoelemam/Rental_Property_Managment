import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import { Request } from 'express';

// إنشاء S3 Client
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});

const BUCKET_NAME = process.env.BUCKET_NAME || process.env.AWS_S3_BUCKET || 'property-management-uploads';

// فلترة الملفات (صور فقط)
const imageFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = allowedTypes.test(file.mimetype);

    if (extName && mimeType) {
        cb(null, true);
    } else {
        cb(new Error('فقط الصور مسموح بها (jpeg, jpg, png, gif, webp)'));
    }
};

// تحديد المجلد حسب الـ URL
const getKeyPrefix = (req: Request): string => {
    const fullUrl = req.baseUrl + req.path;
    if (fullUrl.includes('/user/') || fullUrl.includes('/users/')) {
        return 'users';
    } else if (fullUrl.includes('/property/') || fullUrl.includes('/properties/')) {
        return 'properties';
    } else if (fullUrl.includes('/unit/') || fullUrl.includes('/units/')) {
        return 'units';
    }
    return 'uploads';
};

// إعداد multer-s3
const s3Storage = multerS3({
    s3: s3Client,
    bucket: BUCKET_NAME,
    // acl removed - use bucket policy for public access
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req: Request, file: Express.Multer.File, cb: (error: any, metadata: any) => void) => {
        cb(null, { fieldName: file.fieldname });
    },
    key: (req: Request, file: Express.Multer.File, cb: (error: any, key: string) => void) => {
        const prefix = getKeyPrefix(req);
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `${prefix}/${uniqueSuffix}${ext}`);
    },
});

// إعداد multer للـ S3
export const uploadS3 = multer({
    storage: s3Storage,
    fileFilter: imageFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
    },
});

// Single image upload
export const uploadAvatarS3 = uploadS3.single('avatar');

// Multiple images upload (max 5)
export const uploadMultipleS3 = uploadS3.array('images', 5);

// Helper: الحصول على URL الكامل للصورة
export const getS3Url = (key: string): string => {
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
};

// Helper: حذف صورة من S3
export const deleteFromS3 = async (key: string): Promise<void> => {
    try {
        await s3Client.send(new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        }));
    } catch (error) {
        console.error('Error deleting from S3:', error);
    }
};

// Export S3 client for advanced usage
export { s3Client, BUCKET_NAME };
