import {Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {Users} from "./Users";
import {Company} from "./Company";
import {Message} from "./Message";
import {UserChat} from "./UserChat";

@Entity()
export class Chat {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Users, (user) => user.chats, { onDelete: 'CASCADE' }) // Связь с пользователем
    user: Users;

    @ManyToOne(() => Company, (company) => company.chats, { onDelete: 'CASCADE' }) // Связь с компанией
    @JoinColumn({name: "company_id"})
    company: Company;

    @OneToMany(() => Message, (message) => message.chat)
    messages: Message[];

    @OneToMany(() => UserChat, (userChat) => userChat.chat)
    userChats: UserChat[];
}