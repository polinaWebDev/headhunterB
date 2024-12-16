import express from "express";
import {Chat} from "../entity/Chat";
import {AppDataSource} from "../data-source";
import {checkAuth} from "../middleware/checkAuth";
import {Message} from "../entity/Message";
import {Users} from "../entity/Users";
import {Company} from "../entity/Company";
import {Job} from "../entity/Job";
import {UserChat} from "../entity/UserChat";

const router = express.Router();

router.get("/company/:companyId", checkAuth, async (req, res) => {
    try {
        const companyId = req.params.companyId;
        const chatRepository = AppDataSource.getRepository(Chat);


        const companyRepo = AppDataSource.getRepository(Company);
        const company = await companyRepo.findOne({
            where: {company_id: companyId},
        })

        if (!company) {
            res.status(404).json({ message: 'Company not found.' });
            return;
        }

        const chats = await chatRepository.find({
            where: { company: company },
            relations: ["user", "messages"],
        });

        res.json(chats);
    } catch (error) {
        console.error("Error fetching company chats:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/:userId/:companyId", async (req, res) => {
    const { userId, companyId } = req.params;

    try {
        // Проверка валидности companyId
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(companyId);
        if (!isUUID) {
            res.status(400).json({ message: "Invalid company ID format" });
            return;
        }

        // Поиск компании
        const companyRepo = AppDataSource.getRepository(Company);
        const company = await companyRepo.findOne({
            where: { company_id: companyId },
        });

        if (!company) {
            res.status(404).json({ message: "Company not found" });
            return;
        }

        // Поиск чата
        const chatRepository = AppDataSource.getRepository(Chat);
        const chat = await chatRepository.findOne({
            where: {
                user: { id: userId },
                company: { company_id: companyId }, // Используем упрощенный поиск
            },
            relations: ["messages", "messages.sender"],
        });

        if (!chat) {
            res.status(404).json({ message: "Chat not found" });
            return;
        }

        // Возвращаем сообщения
        const messages = chat.messages;
        res.json(messages);
    } catch (error) {
        console.error("Ошибка при получении сообщений:", error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

router.get("/user/:userId", checkAuth, async (req, res) => {
    try {
        const userId = req.params.userId;
        const chatRepository = AppDataSource.getRepository(Chat);

        // Получаем чаты, в которых участвует пользователь
        const userChats = await chatRepository.find({
            where: { user: { id: userId } },
            relations: ["company", "messages", "messages.sender"],
        });

        // Получаем чаты, в которых пользователь участвует от имени компании
        const companyChats = await chatRepository.find({
            where: { company: { members: { user: { id: userId } } } }, // Важно!
            relations: ["company", "messages", "messages.sender"],
        });

        res.json({ userChats, companyChats });
    } catch (error) {
        console.error("Ошибка при получении чатов:", error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

// Серверный роут для получения чатов компании
router.get("/company/:companyId", checkAuth, async (req, res) => {
    try {
        const companyId = req.params.companyId;
        const chatRepository = AppDataSource.getRepository(Chat);

        const companyChats = await chatRepository.find({
            where: { company: { company_id: companyId } },
            relations: ["user", "messages", "messages.sender"],
        });

        res.json(companyChats);
    } catch (error) {
        console.error("Ошибка при получении чатов:", error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});


router.get("/user", checkAuth, async (req, res) => {
    const user = req.user;

    if (!user) {
        res.status(401).json({ message: 'Not authorized' });
        return
    }

    try {
        const chatRepository = AppDataSource.getRepository(Chat);
        const chats = await chatRepository
            .createQueryBuilder("chat")
            .leftJoinAndSelect("chat.userChats", "userChat")
            .leftJoinAndSelect("userChat.user", "user")
            .leftJoinAndSelect("chat.company", "company")
            .leftJoinAndSelect("chat.messages", "message")
            .leftJoinAndSelect("message.sender", "sender")
            .where("userChat.userId = :userId", { userId: user.id })
            .orderBy("message.createdAt", "DESC") // Сортировка по последнему сообщению, если оно есть
            .getMany();

        const formattedChats = chats.map(chat => {
            const otherParticipants = chat.userChats
                .filter(uc => uc.user.id !== user.id)
                .map(uc => ({ id: uc.user.id, name: uc.user.name }));

            const lastMessage = chat.messages.length > 0
                ? {
                    content: chat.messages[0].content,
                    createdAt: chat.messages[0].createdAt,
                    sender: { id: chat.messages[0].sender.id, name: chat.messages[0].sender.name }
                }
                : null;

            return {
                id: chat.id,
                company: chat.company,
                otherParticipants, // Массив других участников
                lastMessage,
            };
        });

        res.status(200).json(formattedChats);

    } catch (error) {
        console.error("Ошибка при получении чатов:", error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});
router.post("/:userId/:companyId", checkAuth, async (req, res) => {
    const { userId, companyId } = req.params;
    const { content } = req.body;

    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized: No user found' });
        return;
    }

    const member = req.user;

    try {
        const chatRepository = AppDataSource.getRepository(Chat);
        const userRepository = AppDataSource.getRepository(Users);
        const companyRepository = AppDataSource.getRepository(Company);
        const messageRepository = AppDataSource.getRepository(Message);
        const userChatRepository = AppDataSource.getRepository(UserChat); // Добавьте репозиторий UserChat


        let chat = await chatRepository.findOne({
            where: {
                user: { id: userId }, // userId и companyId могут быть строками, преобразуйте их в числа
                company: { company_id: companyId },
            },
            relations: ["user", "company"] // Добавьте relations для избежания дополнительных запросов
        });

        if (!chat) {
            const user = await userRepository.findOne({ where: { id: userId } });
            const company = await companyRepository.findOne({ where: { company_id: companyId } });

            if (!user || !company) {
                res.status(404).json({ error: "Пользователь или компания не найдены" });
                return
            }

            chat = new Chat(); // Создайте новый экземпляр Chat
            chat.user = user;
            chat.company = company;
            await chatRepository.save(chat);


            // Создайте записи в UserChat для пользователя и компании
            const userChatUser = new UserChat();
            userChatUser.user = user;
            userChatUser.chat = chat;
            await userChatRepository.save(userChatUser);



            const userChatCompany = new UserChat(); // Предполагается, что у Company есть поле user
            userChatCompany.user = member; // Замените company.user на актуальное поле, связывающее компанию с пользователем
            userChatCompany.chat = chat;
            await userChatRepository.save(userChatCompany);



        }

        const user = await userRepository.findOneBy({id: userId})
        if (!user) {
            res.status(401).json({ message: 'Unauthorized: No user found' });
            return;
        }

        // ... остальной код (создание сообщения)
        const newMessage = new Message();
        newMessage.content = content;
        newMessage.sender = user;
        newMessage.chat = chat;
        await messageRepository.save(newMessage);


        res.status(201).json(newMessage);

    } catch (error) {
        console.error("Ошибка при создании сообщения:", error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});


export default router;