import { Request, Response } from 'express';
import {AppDataSource} from "../data-source";
import {Company} from "../entity/Company";

export const uploadCompanyAvatar = async (req: Request<{ companyId: string }>, res: Response) => {
    const {companyId} = req.params;

    if (!req.file) {
        res.status(400).send({'No file uploaded': false});
        return
    }

    const avatarPath = `/uploads/company_avatars/${req.file.filename}`;

    try {
        const companyRepo = await AppDataSource.getRepository(Company);
        await companyRepo.update(companyId,{avatar: avatarPath });
        res.status(200).json({ message: 'Company avatar uploaded successfully', avatarPath });
    } catch (error) {
        console.error('Error uploading company avatar:', error);
        res.status(500).json({ message: 'Server Error', error });
    }
}