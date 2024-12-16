import express from "express";
import {Company} from "../entity/Company";
import { Users} from "../entity/Users";
import {AppDataSource} from "../data-source";
import {checkAuth} from "../middleware/checkAuth";
import {UserRole} from "../Roles";
import {CompanyMember} from "../entity/CompanyMember";
import {AuthenticatedRequest} from "./application";


const router = express.Router();


router.post('/create', checkAuth, async (req: AuthenticatedRequest, res) => {
    const { name, description } = req.body;
    const user = req.user;

    if (!user) {
        res.status(404).send("Пользователь не найден");
        return;
    }

    try {
        const companyRepository = AppDataSource.getRepository(Company);
        const companyMemberRepository = AppDataSource.getRepository(CompanyMember);

        // Создаем новую компанию
        const newCompany = companyRepository.create({
            name,
            description,
            owner: { id: user.id }, // Указываем владельца компании
        });

        // Сохраняем компанию
        const savedCompany = await companyRepository.save(newCompany);

        // Добавляем владельца как члена компании
        const companyMember = companyMemberRepository.create({
            company: savedCompany,
            user: user,
            role: UserRole.OWNER,
        });

        await companyMemberRepository.save(companyMember);

        // Отправляем успешный ответ
        res.status(201).json({ message: "Компания создана", company: savedCompany });
    } catch (error) {
        console.error('Ошибка при регистрации компании:', error);
        res.status(500).send('Внутренняя ошибка сервера');
    }
});


// Получение компаний пользователя по его ID
router.get('/my-companies/:userId', checkAuth, async (req: AuthenticatedRequest, res) => {
    const { userId } = req.params;

    try {
        const companyRepository = AppDataSource.getRepository(Company);
        const companyMemberRepository = AppDataSource.getRepository(CompanyMember);

        // Получаем компании, где пользователь является владельцем
        const ownerCompanies = await companyRepository.find({
            where: {
                owner: { id: userId }, // Фильтруем компании, где пользователь владелец
            },
        });

        // Получаем членства пользователя (где он член или менеджер)
        const memberships = await companyMemberRepository.find({
            where: {
                user: { id: userId },
            },
            relations: ['company'], // Подгружаем связанные компании
        });

        // Собираем все уникальные компании
        const companies = [
            ...ownerCompanies, // Компании, где пользователь владелец
            ...memberships.map((membership) => membership.company), // Компании, где он член или менеджер
        ];

        // Убираем возможные дубликаты компаний
        const uniqueCompanies = Array.from(
            new Map(companies.map((company) => [company.company_id, company])).values()
        );

        if (uniqueCompanies.length > 0) {
            res.status(200).json(uniqueCompanies);
        } else {
            res.status(404).json({ message: 'Нет компаний для этого пользователя' });
        }
    } catch (error) {
        console.error('Ошибка при получении компаний:', error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
});



router.put('/company/:companyId', checkAuth, async (req: AuthenticatedRequest, res) => {
    const companyId = req.params.companyId;
    const {name, description} = req.body;

    if (!req.user) {
        res.status(401).json({message: 'Not authorized'});
        return;
    }

    if (!name || !description) {
        res.status(400).json({message: 'No name or description'});
        return;
    }

    try {
        const companyRepository = AppDataSource.getRepository(Company);
        const company= await companyRepository.findOne({
            where: {company_id: companyId},
            relations: ['owner'],
        })

        if (!company) {
            res.status(404).json({message: 'No company'});
            return;
        }

        if (company.owner.id !== req.user.id) {
            res.status(403).json({message: 'You are not owner'});
            return;
        }

        company.name = name;
        company.description = description;

        await companyRepository.save(company);

        res.status(200).json({message: 'Company successfully.'});
    } catch (error) {
        console.error(error)
        res.status(500).json('Internal Server Error')
    }
})


export default router;