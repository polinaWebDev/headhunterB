import {Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn} from "typeorm";
import {Company} from "./Company";
import { Users} from "./Users";
import {UserRole} from "../Roles";


@Entity()
export class CompanyMember {
    @PrimaryGeneratedColumn("uuid")
    id: string;


    @ManyToOne(() => Company, (company) => company.members)
    @JoinColumn({name: "company_id"})
    company: Company;

    @ManyToOne(() => Users, (user) => user.memberships)
    user: Users;

    @Column({
        type: "enum",
        enum: UserRole,
        default: UserRole.MEMBER
    })
    role: UserRole;

    get companyName(): string {
        return this.company?.name || ''; // Возвращает имя компании, если она существует
    }
}