import {Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {Users} from "./Users";
import {Chat} from "./Chat";

@Entity()
export class UserChat {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Users, (user) => user.userChats)
    user: Users;

    @ManyToOne(() => Chat, (chat) => chat.userChats)
    chat: Chat;
}