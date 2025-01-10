import { Request } from 'express';
import {checkAuth} from "../middleware/checkAuth";
import router from "./job";
import {AppDataSource} from "../data-source";
import {Users} from "../entity/Users";

import {Application} from "../entity/Application";
import {Status} from "../status";
import {Job} from "../entity/Job";
import {UserChat} from "../entity/UserChat";
import {Chat} from "../entity/Chat";

export interface AuthenticatedRequest extends Request {
    user?: Users;  // Типизируем user как объект типа Users
}

router.post("/application/:jobId", checkAuth, async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized: No user found' });
        return;
    }

    const userId = req.user.id;
    const jobId = req.params.jobId;

    try {
        console.log('Processing application for job:', jobId, 'and user:', userId);

        const user = await AppDataSource.getRepository(Users).findOne({ where: { id: userId } });
        const job = await AppDataSource.getRepository(Job).findOne({ where: { job_id: jobId }, relations: ["company"] });

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        if (!job) {
            res.status(404).json({ message: 'Job not found' });
            return;
        }

        // Проверяем, подал ли пользователь уже заявку на эту вакансию
        const applicationRepository = AppDataSource.getRepository(Application);
        const existingApplication = await applicationRepository.findOne({
            where: { user: user, job: job },
        });

        if (existingApplication) {
            res.status(400).json({ message: 'You have already applied for this job' });
            return;
        }

        // Создаем заявку
        const newApplication = applicationRepository.create({
            user,
            job,
            status: Status.PENDING,
        });

        console.log('Saving new application:', newApplication);
        await applicationRepository.save(newApplication);

        // Шаг 1: Создаём чат между пользователем и компанией
        const chatRepository = AppDataSource.getRepository(Chat);
        const company = job.company; // Получаем компанию из вакансии

        if (!user) {
            console.error("User not found");
            res.status(404).json({ message: "User not found" });
            return
        }

        if (!company) {
            console.error("Company not found");
            res.status(404).json({ message: "Company not found" });
            return
        }

        let chat = await chatRepository.findOne({
            where: [
                { user: { id: user.id }, company: { company_id: company.company_id } }
            ],
            relations: ["user", "company"]
        });

        if (!chat) {
            chat = new Chat();
            chat.user = user;
            chat.company = company;
            await chatRepository.save(chat);

            // Шаг 2: Создаём записи в UserChat для пользователя и компании
            const userChatRepository = AppDataSource.getRepository(UserChat);

            // Для пользователя
            const userChatUser = new UserChat();
            userChatUser.user = user;
            userChatUser.chat = chat;
            await userChatRepository.save(userChatUser);

            // Для компании
            const userChatCompany = new UserChat();
            userChatCompany.user = null; // Предполагаем, что владелец компании — это пользователь
            userChatCompany.chat = chat;
            await userChatRepository.save(userChatCompany);
        }

        // Шаг 3: Отправляем сообщение о том, что заявка подана и чат создан
        res.status(200).json({ message: 'Application saved successfully and chat created', chatId: chat.id });
    } catch (error) {
        console.error('Error processing application:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;