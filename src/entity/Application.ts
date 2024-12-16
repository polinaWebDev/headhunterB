import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {Users} from "./Users";
import {Status} from "../status";
import {Job} from "./Job";

@Entity()
export class Application {
    @PrimaryGeneratedColumn()
    application_id: number;

    @Column({
        type: "enum",
        enum: Status,
        default: Status.PENDING
    })
    status: Status;

    @ManyToOne(() => Users, (user) => user.applications)
    user: Users;

    @ManyToOne(() => Job, (job) => job.applications, { eager: true })
    @JoinColumn({ name: 'job_id' })
    job: Job;

} 