import multer, { FileFilterCallback } from "multer";
import { Request } from "express";

const storage = multer.diskStorage({
    destination: (
        req: Request,
        file: Express.Multer.File,
        callback: (error: Error | null, destination: string) => void
    ) => {
        callback(null, 'src/uploads/user_avatars');
    },
    filename: (
        req: Request,
        file: Express.Multer.File,
        callback: (error: Error | null, filename: string) => void
    ) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        callback(null, `${uniqueSuffix}-${file.originalname}`);
    },
});

const fileFilter: multer.Options["fileFilter"] = (
    req: Request,
    file: Express.Multer.File,
    callback: FileFilterCallback
) => {
    if (file.mimetype.startsWith("image/")) {
        callback(null, true);
    } else {
        callback(new Error("Invalid file type. Only images are allowed"));
    }
};

export const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter,
});

