import express from 'express';
import multer from 'multer';
import { uploadUserAvatar } from '../controllers/userAvatarController';
import { uploadCompanyAvatar } from '../controllers/companyAvatarController';
import path from 'path';

const router = express.Router();

const userUpload = multer();
const companyUpload = multer();

router.post('/user/:userId/avatar', userUpload.single('avatar'), uploadUserAvatar);
router.post('/company/:companyId/avatar', companyUpload.single('avatar'), uploadCompanyAvatar);

router.get('/avatar/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '..', '..', 'uploads', 'user_avatars', filename);

    console.log(filePath);
    console.log(filename);

    res.sendFile(filePath, (err) => {
        if (err) {
            console.error(err);
            res.status(404).json({ message: 'File not found' });
        }
    });
});

export default router;
