import {Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn} from "typeorm";
import {Users} from "./Users";


@Entity()
export class Resume {
    @PrimaryGeneratedColumn()
    resume_id: number;

    @Column()
    title: string;

    @Column()
    content: string

    @Column({nullable:true})
    created_at: Date;

    @Column({nullable:true})
    isArchived: boolean

    @ManyToOne(() => Users, (user) => user.resumes)
    @JoinColumn({ name: 'userId'})
    userId: Users;
}
