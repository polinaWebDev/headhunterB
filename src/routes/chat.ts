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
router.get("/company/:companyId", async (req, res) => {
    const { companyId } = req.params;

    try {
        const chatRepository = AppDataSource.getRepository(Chat);
        const chats = await chatRepository
            .createQueryBuilder("chat")
            .leftJoinAndSelect("chat.userChats", "userChat")
            .leftJoinAndSelect("userChat.company", "company")
            .leftJoinAndSelect("chat.messages", "message")
            .leftJoinAndSelect("message.sender", "sender")
            .where("userChat.company.company_id = :companyId", { companyId })
            .orderBy("message.createdAt", "DESC")
            .getMany();

        const formattedChats = chats.map(chat => {
            const lastMessage = chat.messages.length > 0
                ? {
                    content: chat.messages[0].content,
                    createdAt: chat.messages[0].createdAt,
                }
                : null;

            return {
                id: chat.id,
                company: chat.userChats.find(uc => uc.company)?.company,
                lastMessage,
            };
        });

        res.status(200).json(formattedChats);
    } catch (error) {
        console.error("Ошибка при получении чатов для компании:", error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});


router.get("/user", checkAuth, async (req, res) => {
    const user = req.user;

    if (!user) {
        res.status(401).json({ message: "Not authorized" });
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
            .leftJoinAndSelect("message.senderUser", "senderUser")
            .leftJoinAndSelect("message.senderCompany", "senderCompany")
            .where("userChat.userId = :userId", { userId: user.id })
            .orderBy("message.createdAt", "DESC")
            .getMany();

        const formattedChats = chats.map((chat) => {
            // Получаем других участников чата, исключая текущего пользователя
            const otherParticipants = chat.userChats
                .filter((uc) => uc.user?.id !== user.id)
                .map((uc) => ({
                    id: uc.user?.id,
                    name: uc.user?.name,
                }));

            // Получаем последнее сообщение чата, если оно есть
            const lastMessage = chat.messages.length > 0
                ? {
                    content: chat.messages[0].content,
                    createdAt: chat.messages[0].createdAt,
                    sender: chat.messages[0].senderUser
                        ? {
                            id: chat.messages[0].senderUser.id,
                            name: chat.messages[0].senderUser.name,
                            type: "user",
                        }
                        : chat.messages[0].senderCompany
                            ? {
                                id: chat.messages[0].senderCompany.company_id,
                                name: chat.messages[0].senderCompany.name,
                                type: "company",
                            }
                            : { id: "unknown", name: "Unknown Sender", type: "unknown" },
                }
                : null;

            return {
                id: chat.id,
                company: chat.company
                    ? {
                        company_id: chat.company.company_id,
                        name: chat.company.name,
                    }
                    : null,
                otherParticipants, // Другие участники чата
                lastMessage,       // Последнее сообщение чата
            };
        });


         res.status(200).json(formattedChats);
        return
    } catch (error) {
        console.error("Ошибка при получении чатов:", error);
        res.status(500).json({ error: "Ошибка сервера" });
        return
    }
});


router.post("/:userId/:companyId", checkAuth, async (req, res) => {
    const { userId, companyId } = req.params;
    const { content } = req.body;

    // Проверка авторизации
    if (!req.user) {
        res.status(401).json({ message: "Unauthorized: No user found" });
        return
    }

    const senderUser = req.user; // Текущий авторизованный пользователь

    try {
        const chatRepository = AppDataSource.getRepository(Chat);
        const userRepository = AppDataSource.getRepository(Users);
        const companyRepository = AppDataSource.getRepository(Company);
        const messageRepository = AppDataSource.getRepository(Message);
        const userChatRepository = AppDataSource.getRepository(UserChat);

        // Поиск существующего чата между пользователем и компанией
        let chat = await chatRepository.findOne({
            where: {
                userChats: { user: { id: userId } },
                company: { company_id: companyId },
            },
            relations: ["userChats", "company"],
        });

        // Если чат не существует, создаём его
        if (!chat) {
            const recipientUser = await userRepository.findOne({ where: { id: userId } });
            const company = await companyRepository.findOne({ where: { company_id: companyId } });

            if (!recipientUser || !company) {
                res.status(404).json({ error: "Пользователь или компания не найдены" });
                return
            }

            // Создание нового чата
            chat = new Chat();
            chat.company = company;
            chat.user = recipientUser;
            await chatRepository.save(chat);

            // Создание записей в UserChat для участников
            const userChatUser = new UserChat();
            userChatUser.user = recipientUser;
            userChatUser.chat = chat;
            await userChatRepository.save(userChatUser);

            const userChatSender = new UserChat();
            userChatSender.user = senderUser;
            userChatSender.chat = chat;
            await userChatRepository.save(userChatSender);

            const userChatCompany = new UserChat();
            userChatCompany.company = company; // Связываем компанию
            userChatCompany.user = null; // Явно указываем, что это не пользователь
            userChatCompany.chat = chat;
            await userChatRepository.save(userChatCompany);
        }

        // Создание сообщения
        const newMessage = new Message();
        newMessage.content = content;
        newMessage.chat = chat;

        // Определяем отправителя: авторизованный пользователь
        newMessage.senderUser = senderUser; // senderUser - текущий пользователь

        // Сохранение сообщения
        await messageRepository.save(newMessage);

        res.status(201).json({
            id: newMessage.id,
            content: newMessage.content,
            createdAt: newMessage.createdAt,
            sender: {
                id: senderUser.id,
                name: senderUser.name,
                type: "user",
            },
        });
    } catch (error) {
        console.error("Ошибка при создании сообщения:", error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});


export default router;