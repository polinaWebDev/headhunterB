import {Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn} from "typeorm";
import { Chat } from "./Chat";
import {Users} from "./Users";

@Entity()
export class Message {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    content: string;

    @ManyToOne(() => Users, (user) => user.sentMessages, { eager: true })
    sender: Users;


    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => Chat, (chat) => chat.messages, { onDelete: 'CASCADE' }) // Добавлено onDelete: 'CASCADE'
    chat: Chat;
}