import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { Users } from "../entity/Users";
import {AppDataSource} from "../data-source";
import {AuthenticatedRequest} from "../routes/application";

export interface JwtPayloadUser {
    id: string;
    email: string;
    name: string;
    avatar?: string;
}

export const checkAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const token = req.headers['authorization']?.split(' ')[1];
    console.log("Token:", token);

    if (!token) {
        res.status(401).send('No token provided');
        return;
    }

    try {
        const decoded = jwt.verify(token, 'SECRET_KEY') as JwtPayloadUser;
        console.log(decoded);

        // Загружаем пользователя из базы данных
        const userRepository = AppDataSource.getRepository(Users);
        const user = await userRepository.findOne({
            where: { id: decoded.id },
            // relations: ['ownedCompanies', 'companies', 'applications', 'resumes', 'memberships']
        });

        console.log(user);

        if (!user) {
            res.status(401).json({ message: 'User not found' });
            return
        }

        // Присваиваем user объекту req
        (req as AuthenticatedRequest).user = user;

        console.log('Authenticated user:', user);
        next();
    } catch (err) {
        console.error('Ошибка проверки токена:', err);
        res.status(403).send('Access denied. Invalid token.');
        return;
    }
};