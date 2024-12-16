import { Request, Response } from 'express';
import {Users} from "../entity/Users";
import {AppDataSource} from "../data-source";
import {writeFileSync} from "node:fs";


export const uploadUserAvatar = async (req: Request<{ userId: string }>, res: Response) => {
    const {userId} = req.params;

    if (!userId) {
        res.status(400).json({ message: 'userId is required' });
        return
    }

    if (!req.file) {
        res.status(400).json({ message: 'No file uploaded' });
        return
    }

    const ava = 'api/uploads/avatar/' + req.file.originalname;

    res.status(200).json({ message: 'User avatar uploaded successfully', ava });

}