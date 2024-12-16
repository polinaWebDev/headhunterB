import {Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, OneToMany, ManyToOne, ManyToMany} from "typeorm"
import {Company} from "./Company";
import {Application} from "./Application";
import {Resume} from "./Resume";
import {CompanyMember} from "./CompanyMember";
import {UserRole} from "../Roles";
import {Chat} from "./Chat";
import {Message} from "./Message";
import {UserChat} from "./UserChat";


@Entity()
export class Users {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    checkIfPasswordIsValid(password: string): boolean {
        return this.password === password;
    }

    @Column()
    name: string;

    @Column({ nullable: true })
    avatar: string;

    @OneToMany(() => Message, (message) => message.sender) // Используйте поле sender для связи
    sentMessages: Message[];


    @ManyToMany(() => Company, (company) => company.members)
    companies: Company[];

    @OneToMany(() => Application, (application) => application.user, { nullable: true })
    applications: Application[];

    @OneToMany(() => Resume, (resume) => resume.userId)
    resumes: Resume[];

    @OneToMany(() => CompanyMember, (membership) => membership.user)
    memberships: CompanyMember[];

    @OneToMany(() => Company, (company) => company.owner)
    ownedCompanies: Company[];

    @OneToMany(() => Chat, (chat) => chat.user)
    chats: Chat[];

    @OneToMany(() => UserChat, (userChat) => userChat.user)
    userChats: UserChat[];

}



