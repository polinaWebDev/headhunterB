import {Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {Users} from "./Users";
import {Chat} from "./Chat";
import {Company} from "./Company";
@Entity()
export class UserChat {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Users, (user) => user.userChats, { nullable: true })
    user: Users | null; // Связь с пользователем

    @ManyToOne(() => Company, (company) => company.chats, { nullable: true })
    company: Company | null; // Связь с компанией

    @ManyToOne(() => Chat, (chat) => chat.userChats)
    chat: Chat;
}