import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { uploadAvatarS3, uploadMultipleS3, deleteFromS3 } from '../../services/s3.service';
import { successResponse, errorResponse } from '../../utils/errorResponse';
import { User, Property, Unit } from '../../DB/models';

// S3 File interface
interface S3File extends Express.Multer.File {
    location: string;
    key: string;
    bucket: string;
}

const router = Router();

router.use(authMiddleware);

// رفع صورة الـ Owner على S3
router.post('/user/avatar', (req: Request, res: Response) => {
    uploadAvatarS3(req, res, async (err: any) => {
        if (err) {
            console.error('S3 Upload Error:', err);
            res.status(400).json(errorResponse(err.message || 'خطأ في رفع الملف', 400));
            return;
        }

        try {
            if (!req.file) {
                res.status(400).json(errorResponse('لم يتم رفع صورة', 400));
                return;
            }

            const file = req.file as S3File;
            const avatarUrl = file.location;

            await User.update({ avatar: avatarUrl }, { where: { id: req.user!.id } });

            res.status(200).json(successResponse('تم رفع الصورة بنجاح', { avatar: avatarUrl }));
        } catch (error) {
            console.error('DB Error:', error);
            res.status(500).json(errorResponse('خطأ في حفظ الصورة', 500));
        }
    });
});

// رفع صور العقار على S3
router.post('/property/:id/images', (req: Request, res: Response) => {
    uploadMultipleS3(req, res, async (err: any) => {
        if (err) {
            console.error('S3 Upload Error:', err);
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

            if (!req.files || (req.files as S3File[]).length === 0) {
                res.status(400).json(errorResponse('لم يتم رفع صور', 400));
                return;
            }

            const files = req.files as S3File[];
            const imageUrls = files.map(f => f.location);

            // دمج الصور الجديدة مع القديمة
            let existingImages: string[] = [];
            if (property.images) {
                try { existingImages = JSON.parse(property.images); } catch (e) { }
            }
            const allImages = [...existingImages, ...imageUrls];

            await property.update({ images: JSON.stringify(allImages) });

            res.status(200).json(successResponse('تم رفع الصور بنجاح', { images: allImages }));
        } catch (error) {
            console.error('DB Error:', error);
            res.status(500).json(errorResponse('خطأ في حفظ الصور', 500));
        }
    });
});

// حذف صورة من العقار (S3 + Database)
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

        // حذف من S3
        if (imageUrl.includes('s3.') && imageUrl.includes('amazonaws.com')) {
            // استخراج الـ key من الـ URL
            const urlParts = imageUrl.split('.amazonaws.com/');
            if (urlParts.length > 1) {
                const key = urlParts[1];
                await deleteFromS3(key);
            }
        }

        await property.update({ images: JSON.stringify(updatedImages) });

        res.status(200).json(successResponse('تم حذف الصورة بنجاح', { images: updatedImages }));
    } catch (error) {
        console.error('Delete Error:', error);
        res.status(500).json(errorResponse('خطأ في حذف الصورة', 500));
    }
});

// رفع صور الوحدة على S3
router.post('/unit/:id/images', (req: Request, res: Response) => {
    uploadMultipleS3(req, res, async (err: any) => {
        if (err) {
            console.error('S3 Upload Error:', err);
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

            if (!req.files || (req.files as S3File[]).length === 0) {
                res.status(400).json(errorResponse('لم يتم رفع صور', 400));
                return;
            }

            const files = req.files as S3File[];
            const imageUrls = files.map(f => f.location);

            // دمج الصور الجديدة مع القديمة
            let existingImages: string[] = [];
            if (unit.images) {
                try { existingImages = JSON.parse(unit.images); } catch (e) { }
            }
            const allImages = [...existingImages, ...imageUrls];

            await unit.update({ images: JSON.stringify(allImages) });

            res.status(200).json(successResponse('تم رفع الصور بنجاح', { images: allImages }));
        } catch (error) {
            console.error('DB Error:', error);
            res.status(500).json(errorResponse('خطأ في حفظ الصور', 500));
        }
    });
});

// حذف صورة من الوحدة (S3 + Database)
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

        // حذف من S3
        if (imageUrl.includes('s3.') && imageUrl.includes('amazonaws.com')) {
            const urlParts = imageUrl.split('.amazonaws.com/');
            if (urlParts.length > 1) {
                const key = urlParts[1];
                await deleteFromS3(key);
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
