import {Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn} from "typeorm";
import { Chat } from "./Chat";
import {Users} from "./Users";
import {Company} from "./Company";

@Entity()
export class Message {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    content: string;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => Users, (user) => user.sentMessages, { nullable: true })
    senderUser: Users | null;

    @ManyToOne(() => Company, (company) => company.sentMessages, { nullable: true })
    @JoinColumn({ name: 'senderCompanyId'})
    senderCompany: Company | null;

    @ManyToOne(() => Chat, (chat) => chat.messages)
    chat: Chat;
}