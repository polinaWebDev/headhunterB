import {Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {Job} from "./Job";
import { Users} from "./Users";
import {CompanyMember} from "./CompanyMember";
import {Message} from "./Message";
import {Chat} from "./Chat";

@Entity()
export class Company {
    @PrimaryGeneratedColumn("uuid")
    company_id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    avatar: string;

    @Column({ nullable: true })
    description: string;

    @ManyToOne(() => Users, (user) => user.ownedCompanies, { cascade: ['remove'] })
    owner: Users;

    @OneToMany(() => CompanyMember, (member) => member.company, { cascade: ['insert', 'remove'] })
    @JoinTable()
    members: CompanyMember[];

    @OneToMany(() => Job, (job) => job.company)
    jobs: Job[];

    @OneToMany(() => Chat, (chat) => chat.company)
    chats: Chat[];

    @OneToMany(() => Message, (message) => message.senderCompany)
    sentMessages: Message[];
}