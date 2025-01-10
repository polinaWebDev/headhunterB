import express from "express";
import { AppDataSource } from "./data-source";
import authRoutes from "./routes/auth";
import update from "./routes/update";
import createCompany from "./routes/company";
import profile from "./routes/profile";
import invite from "./routes/invite";
import posting from "./routes/posting";
import application from "./routes/application";
import cors from "cors";
import job from "./routes/job";
import { checkAuth } from "./middleware/checkAuth";
import { Server } from "socket.io";
import * as http from "node:http";
import resume from "./routes/resume";
import avatar from "./routes/avatar";
import company from "./routes/company";
import details from "./routes/details";
import { Chat } from "./entity/Chat";
import chat from "./routes/chat";
import {Message} from "./entity/Message";
import {Users} from "./entity/Users";
import {Company} from "./entity/Company";
import {UserChat} from "./entity/UserChat";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5176",
        methods: ["GET", "POST"],
    },
});

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

// Инициализация базы данных
AppDataSource.initialize()
    .then(() => {
        console.log("Database connection established");

        // Подключение маршрутов
        app.use("/auth", authRoutes);
        app.use("/update", update);
        app.use(profile);
        app.use("/companies", company);
        app.use(invite);
        app.use(posting);
        app.use(application);
        app.use(job);
        app.use(resume);
        app.use(details);
        app.use("/api/uploads", avatar);
        app.use('/chat', chat);

        const PORT = process.env.PORT || 3000;
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}.`);
        });

        io.on('connection', (socket) => {
            console.log(`User connected: ${socket.id}`);

            socket.on('joinChat', (chatId: string) => {
                socket.join(`chat-${chatId}`);
                console.log(`User joined chat: chat-${chatId}`);


                const loadMessages = async () => {
                    try {
                        const messageRepository = AppDataSource.getRepository(Message);

                        const messages = await messageRepository.find({
                            where: { chat: { id: parseInt(chatId) } },
                            relations: ["senderUser", "senderCompany"],
                            order: { createdAt: "ASC" },
                        });


                        const formattedMessages = messages.map((message) => ({
                            content: message.content,
                            createdAt: message.createdAt,
                            sender: message.senderUser
                                ? { id: message.senderUser.id, name: message.senderUser.name, type: "user" }
                                : message.senderCompany
                                    ? { id: message.senderCompany?.company_id, name: message.senderCompany?.name, type: "company" }
                                    : { id: "unknown", name: "Unknown Sender", type: "unknown" },
                        }));

                        socket.emit("loadMessages", formattedMessages);
                    } catch (error) {
                        console.error("Ошибка при загрузке сообщений:", error);
                    }
                };

                loadMessages();
            });

            socket.on("sendMessage", async (data) => {
                const { chatId, content, senderId, type } = data;

                try {
                    const chatRepository = AppDataSource.getRepository(Chat);
                    let chat = await chatRepository.findOne({ where: { id: parseInt(chatId) } });

                    if (!chat) {
                        const userRepository = AppDataSource.getRepository(Users);
                        const companyRepository = AppDataSource.getRepository(Company);

                        const user = await userRepository.findOne({ where: { id: senderId } });
                        const company = await companyRepository.findOne({ where: { company_id: senderId } });

                        if (!user || !company) {
                            console.error("Пользователь или компания не найдены.");
                            return;
                        }

                        // Создаем новый чат, если его нет
                        chat = new Chat();
                        chat.user = user;
                        chat.company = company;
                        await chatRepository.save(chat);

                        // Отправляем событие на клиент
                        socket.emit("newChat", { chatId: chat.id, userId: user.id });

                        // Создаем записи в UserChat для пользователя и компании
                        const userChatRepository = AppDataSource.getRepository(UserChat);
                        const userChatUser = new UserChat();
                        userChatUser.user = user;
                        userChatUser.chat = chat;
                        await userChatRepository.save(userChatUser);

                        const userChatCompany = new UserChat();
                        userChatCompany.user = company.owner; // Владелец компании — это пользователь
                        userChatCompany.chat = chat;
                        await userChatRepository.save(userChatCompany);
                    }

                    // Далее добавляем сообщение в чат
                    const messageRepository = AppDataSource.getRepository(Message);
                    const newMessage = new Message();
                    newMessage.content = content;
                    newMessage.chat = chat;

                    if (type === "user") {
                        const userRepository = AppDataSource.getRepository(Users);
                        const sender = await userRepository.findOne({ where: { id: senderId } });
                        newMessage.senderUser = sender;
                    } else if (type === "company") {
                        const companyRepository = AppDataSource.getRepository(Company);
                        const sender = await companyRepository.findOne({ where: { company_id: senderId } });
                        newMessage.senderCompany = sender;
                    }

                    await messageRepository.save(newMessage);

                    io.to(`chat-${chatId}`).emit("receiveMessage", {
                        content: newMessage.content,
                        createdAt: newMessage.createdAt,
                        sender: {
                            id: type === "user" ? newMessage.senderUser?.id : newMessage.senderCompany?.company_id,
                            type: type,
                            name: type === "user" ? newMessage.senderUser?.name : newMessage.senderCompany?.name,
                        },
                    });
                } catch (error) {
                    console.error("Ошибка при сохранении сообщения:", error);
                }
            });

            socket.on('disconnect', () => {
                console.log(`User disconnected: ${socket.id}`);
            });
        });



    })
    .catch((error) => {
        console.error("Error during Data Source initialization:", error);
    });