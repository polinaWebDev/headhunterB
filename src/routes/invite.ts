import {Router} from "express";
import {checkAuth} from "../middleware/checkAuth";
import {AppDataSource} from "../data-source";
import {CompanyMember} from "../entity/CompanyMember";
import {Users} from "../entity/Users";
import {UserRole} from "../Roles";
import {In} from "typeorm";
import {AuthenticatedRequest} from "./application";

const router =  Router()

router.post('/invite', checkAuth, async (req:AuthenticatedRequest, res) => {

    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized: No user found' });
        return;
    }

    const inviterId = req.user.id; // ID пригласившего пользователя
    const {userIdToInvite} = req.body; // ID приглашаемого пользователя



    try {
        const companyMemberRepository = AppDataSource.getRepository(CompanyMember);
        const userRepository = AppDataSource.getRepository(Users);

        // Получение приглашаемого пользователя
        const userToInvite = await userRepository.findOne({ where: { id: userIdToInvite } });
        if (!userToInvite) {
            res.status(404).send("Приглашаемый пользователь не найден");
            return;
        }

        // Проверка роли пригласившего пользователя
        const inviterMembership = await companyMemberRepository.findOne({
            where: {
                user: { id: inviterId },
                role: In([UserRole.OWNER, UserRole.MANAGER]),
            },
            relations: ['company'],
        });

        if (!inviterMembership) {
            res.status(403).send('Вы не являетесь менеджером ни в одной компании');
            return;
        }

        const company = inviterMembership.company;

        // Проверка, является ли приглашенный пользователь уже членом компании
        const existingMember = await companyMemberRepository.findOne({
            where: {
                user: { id: userIdToInvite },
                company: { company_id: company.company_id },
            },
        });

        if (existingMember) {
            res.status(409).send("Пользователь уже является членом компании");
            return;
        }

        // Создание нового члена компании
        const newCompanyMember = new CompanyMember();
        newCompanyMember.company = company;
        newCompanyMember.user = userToInvite;
        newCompanyMember.role = UserRole.MEMBER;

        await companyMemberRepository.save(newCompanyMember);

        res.json({ message: "Пользователь успешно приглашен" });
    } catch (error) {
        console.error('Ошибка при отправке приглашения:', error);
        res.status(500).send("Внутренняя ошибка сервера");
    }
});

export default router