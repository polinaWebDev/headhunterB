import { Request } from 'express';
import {checkAuth} from "../middleware/checkAuth";
import router from "./job";
import {AppDataSource} from "../data-source";
import {Users} from "../entity/Users";

import {Application} from "../entity/Application";
import {Status} from "../status";
import {Job} from "../entity/Job";

export interface AuthenticatedRequest extends Request {
    user?: Users;  // Типизируем user как объект типа Users
}

router.post("/application/:jobId", checkAuth, async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized: No user found' });
        return;
    }

    const userId = req.user.id;
    const jobId = req.params.jobId;

    try {
        console.log('Processing application for job:', jobId, 'and user:', userId);

        const user = await AppDataSource.getRepository(Users).findOne({ where: { id: userId } });
        const job = await AppDataSource.getRepository(Job).findOne({ where: { job_id: jobId } });

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        if (!job) {
            res.status(404).json({ message: 'Job not found' });
            return;
        }

        const applicationRepository = AppDataSource.getRepository(Application);
        const existingApplication = await applicationRepository.findOne({
            where: { user: user, job: job },
        });

        if (existingApplication) {
            res.status(400).json({ message: 'You have already applied for this job' });
            return;
        }

        const newApplication = applicationRepository.create({
            user,
            job,
            status: Status.PENDING,
        });

        console.log('Saving new application:', newApplication);
        await applicationRepository.save(newApplication);

        res.status(200).json({ message: 'Application saved successfully' });
    } catch (error) {
        console.error('Error processing application:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;