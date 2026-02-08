import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { uploadAvatar, uploadMultiple } from '../../middleware/upload.middleware';
import { successResponse, errorResponse } from '../../utils/errorResponse';
import { User, Property, Unit } from '../../DB/models';
import fs from 'fs';
import path from 'path';

const router = Router();

router.use(authMiddleware);

// رفع صورة الـ Owner (Local)
router.post('/user/avatar', (req: Request, res: Response) => {
    uploadAvatar(req, res, async (err: any) => {
        if (err) {
            console.error('Upload Error:', err);
            res.status(400).json(errorResponse(err.message || 'خطأ في رفع الملف', 400));
            return;
        }

        try {
            if (!req.file) {
                res.status(400).json(errorResponse('لم يتم رفع صورة', 400));
                return;
            }

            const avatarPath = `/uploads/users/${req.file.filename}`;
            await User.update({ avatar: avatarPath }, { where: { id: req.user!.id } });

            res.status(200).json(successResponse('تم رفع الصورة بنجاح', { avatar: avatarPath }));
        } catch (error) {
            console.error('DB Error:', error);
            res.status(500).json(errorResponse('خطأ في حفظ الصورة', 500));
        }
    });
});

// رفع صور العقار (Local)
router.post('/property/:id/images', (req: Request, res: Response) => {
    uploadMultiple(req, res, async (err: any) => {
        if (err) {
            console.error('Upload Error:', err);
            res.status(400).json(errorResponse(err.message || 'خطأ في رفع الملفات', 400));
            return;
        }

        try {
            const { id } = req.params;
            const property = await Property.findOne({ where: { id, ownerId: req.user!.id } });

            if (!property) {
                res.status(404).json(errorResponse('العقار غير موجود', 404));
                return;
            }

            if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
                res.status(400).json(errorResponse('لم يتم رفع صور', 400));
                return;
            }

            const files = req.files as Express.Multer.File[];
            const imagePaths = files.map(f => `/uploads/properties/${f.filename}`);

            // دمج الصور الجديدة مع القديمة
            let existingImages: string[] = [];
            if (property.images) {
                try { existingImages = JSON.parse(property.images); } catch (e) { }
            }
            const allImages = [...existingImages, ...imagePaths];

            await property.update({ images: JSON.stringify(allImages) });

            res.status(200).json(successResponse('تم رفع الصور بنجاح', { images: allImages }));
        } catch (error) {
            console.error('DB Error:', error);
            res.status(500).json(errorResponse('خطأ في حفظ الصور', 500));
        }
    });
});

// حذف صورة من العقار (Local)
router.delete('/property/:id/images', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { imageUrl } = req.body;

        const property = await Property.findOne({ where: { id, ownerId: req.user!.id } });

        if (!property) {
            res.status(404).json(errorResponse('العقار غير موجود', 404));
            return;
        }

        let existingImages: string[] = [];
        if (property.images) {
            try { existingImages = JSON.parse(property.images); } catch (e) { }
        }

        // حذف من المصفوفة
        const updatedImages = existingImages.filter(img => img !== imageUrl);

        // حذف الملف من السيرفر
        if (imageUrl.startsWith('/uploads/')) {
            const filePath = path.join(process.cwd(), imageUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await property.update({ images: JSON.stringify(updatedImages) });

        res.status(200).json(successResponse('تم حذف الصورة بنجاح', { images: updatedImages }));
    } catch (error) {
        console.error('Delete Error:', error);
        res.status(500).json(errorResponse('خطأ في حذف الصورة', 500));
    }
});

// رفع صور الوحدة (Local)
router.post('/unit/:id/images', (req: Request, res: Response) => {
    uploadMultiple(req, res, async (err: any) => {
        if (err) {
            console.error('Upload Error:', err);
            res.status(400).json(errorResponse(err.message || 'خطأ في رفع الملفات', 400));
            return;
        }

        try {
            const { id } = req.params;
            const unit = await Unit.findByPk(Number(id), {
                include: [{ model: Property, as: 'property', where: { ownerId: req.user!.id } }]
            });

            if (!unit) {
                res.status(404).json(errorResponse('الوحدة غير موجودة', 404));
                return;
            }

            if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
                res.status(400).json(errorResponse('لم يتم رفع صور', 400));
                return;
            }

            const files = req.files as Express.Multer.File[];
            const imagePaths = files.map(f => `/uploads/units/${f.filename}`);

            let existingImages: string[] = [];
            if (unit.images) {
                try { existingImages = JSON.parse(unit.images); } catch (e) { }
            }
            const allImages = [...existingImages, ...imagePaths];

            await unit.update({ images: JSON.stringify(allImages) });

            res.status(200).json(successResponse('تم رفع الصور بنجاح', { images: allImages }));
        } catch (error) {
            console.error('DB Error:', error);
            res.status(500).json(errorResponse('خطأ في حفظ الصور', 500));
        }
    });
});

// حذف صورة من الوحدة (Local)
router.delete('/unit/:id/images', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { imageUrl } = req.body;

        const unit = await Unit.findByPk(Number(id), {
            include: [{ model: Property, as: 'property', where: { ownerId: req.user!.id } }]
        });

        if (!unit) {
            res.status(404).json(errorResponse('الوحدة غير موجودة', 404));
            return;
        }

        let existingImages: string[] = [];
        if (unit.images) {
            try { existingImages = JSON.parse(unit.images); } catch (e) { }
        }

        const updatedImages = existingImages.filter(img => img !== imageUrl);

        // حذف الملف من السيرفر
        if (imageUrl.startsWith('/uploads/')) {
            const filePath = path.join(process.cwd(), imageUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await unit.update({ images: JSON.stringify(updatedImages) });

        res.status(200).json(successResponse('تم حذف الصورة بنجاح', { images: updatedImages }));
    } catch (error) {
        console.error('Delete Error:', error);
        res.status(500).json(errorResponse('خطأ في حذف الصورة', 500));
    }
});

export default router;
