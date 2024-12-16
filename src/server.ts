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
                            relations: ["sender"],
                            order: { createdAt: "ASC" },
                        });

                        console.log(messages);



                        socket.emit("loadMessages", messages.map((message) => ({
                            content: message.content,
                            createdAt: message.createdAt,
                            sender: {
                                id: message.sender.id,
                                name: message.sender.name,
                            },
                        })));

                    } catch (error) {
                        console.error("Ошибка при загрузке сообщений:", error);
                    }
                };

                loadMessages();
            });

            socket.on("sendMessage", async (data) => {
                const { chatId, content, senderId } = data;

                try {
                    const chatRepository = AppDataSource.getRepository(Chat);
                    const chat = await chatRepository.findOne({ where: { id: parseInt(chatId) } });
                    const userRepository = AppDataSource.getRepository(Users);
                    const sender = await userRepository.findOne({ where: { id: senderId } });

                    if (!chat ) {
                        console.error("Чат не найдены.");
                        return;
                    }

                    if (!sender) {
                        console.error('Отправитель не найден')
                        return;
                    }

                    const messageRepository = AppDataSource.getRepository(Message);

                    const newMessage = new Message();
                    newMessage.content = content;
                    newMessage.chat = chat;
                    newMessage.sender = sender;
                    await messageRepository.save(newMessage);

                    // Отправляем сообщение всем в комнате chat-chatId
                    io.to(`chat-${chatId}`).emit("receiveMessage", {
                        content: newMessage.content,
                        createdAt: newMessage.createdAt, // Убедитесь, что createdAt инициализирован
                        sender: { id: sender.id, name: sender.name },
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