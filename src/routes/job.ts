import {Router} from "express";
import {AppDataSource} from "../data-source";
import {Job} from "../entity/Job";
import {Like} from "typeorm";
import {checkAuth} from "../middleware/checkAuth";
import {Application} from "../entity/Application";
import {AuthenticatedRequest} from "./application";
import {Status} from "../status";

const router = Router()

router.get('/jobs', async (req, res) => {
    const jobRepository = AppDataSource.getRepository(Job);
    const titleQuery = req.query.title as string;

    try {
        let jobs;
        if (titleQuery) {
            jobs = await jobRepository.find({
                where: { title: Like(`%${titleQuery}%`) }
            });
        } else {
            jobs = await jobRepository.find({
                relations: ['company'], // <--- И здесь
            });
        }
        res.status(200).json(jobs);
    } catch (error) {
        res.status(500).json(error);
    }
});

router.get('/job/:jobId', checkAuth, async (req: AuthenticatedRequest, res) => {
    const { jobId } = req.params;

    try {
        const jobRepository = AppDataSource.getRepository(Job);

        const job = await jobRepository.findOne({
            where: { job_id: jobId },
            relations: ['company', 'company.owner', 'company.members'],
        });

        if (!job) {
            res.status(404).json({ message: 'Вакансия не найдена.' });
            return;
        }

        res.status(200).json(job);
    } catch (error) {
        console.error('Ошибка при получении вакансии:', error);
        res.status(500).json({ message: 'Не удалось загрузить данные вакансии.' });
    }
});

router.put('/job/:jobId', checkAuth, async (req: AuthenticatedRequest, res) => {
    const { jobId } = req.params;
    const { title, description, salary } = req.body;

    try {
        const jobRepository = AppDataSource.getRepository(Job);

        // Находим вакансию
        const job = await jobRepository.findOne({
            where: { job_id: jobId },
            relations: ['company', 'company.owner', 'company.members'],
        });

        if (!job) {
            res.status(404).json({ message: 'Вакансия не найдена.' });
            return;
        }

        // Проверяем права пользователя (владелец или менеджер компании)
        const isManagerOrOwner =
            req.user?.id === job.company.owner.id ||
            job.company.members.some(
                (member) => member.user.id === req.user?.id && member.role === 'manager'
            );

        if (!isManagerOrOwner) {
            res.status(403).json({ message: 'У вас нет прав для редактирования этой вакансии.' });
            return;
        }

        // Обновляем данные вакансии
        if (title) job.title = title;
        if (description) job.description = description;
        if (salary) job.salary = salary;

        await jobRepository.save(job);

        res.status(200).json(job);
    } catch (error) {
        console.error('Ошибка при редактировании вакансии:', error);
        res.status(500).json({ message: 'Не удалось обновить данные вакансии.' });
    }
});

    router.get('/job/:jobId/applications', checkAuth, async (req:AuthenticatedRequest, res) => {
        if (!req.user) {
            res.status(401).json({message: 'No user found'});
            return;
        }

        const jobId = req.params.jobId;

        try {
            const jobRepo = AppDataSource.getRepository(Job);
            const applicationRepo = AppDataSource.getRepository(Application);

            const job = await jobRepo.findOne({
                where: {job_id: jobId},
                relations: ['company', 'company.members', 'company.owner'],
            })

            if (!job) {
                res.status(404).json({message: 'No user found'})
                return;
            }


            const isManagerOrOwner =
                req.user.id === job.company.owner.id ||
                job.company.members.some((member) => member.user.id === req.user?.id && member.role === 'manager');

                if (!isManagerOrOwner) {
                    res.status(403).json({message: 'Access denied: Not a manager or owner'});
                    return;
                }


                const application = await applicationRepo.find({
                    where: {job: {job_id: jobId}},
                    relations: ['user'],
                })

                res.status(200).json(application);

        } catch (error) {
            console.log(error)
            res.status(500).json(error);
        }
    })


router.put('/application/:applicationId/status', checkAuth, async (req:AuthenticatedRequest, res) => {
    const applicationId = +(req.params.applicationId);
    const {status} = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
        res.status(403).json({message: 'Not accepted status'});
        return
    }

    try {
        if (!req.user) {
            res.status(401).json({message: 'No user found'});
            return;
        }

        const applicationRepo = AppDataSource.getRepository(Application);

        const application = await applicationRepo.findOne({
            where: {application_id: applicationId},
            relations: ['job', 'job.company', 'job.company.owner', 'user'],
        })

        if (!application) {
            res.status(404).json({message: 'No user found'});
            return;
        }

        const isManagerOrOwner =
            req.user.id === application.job.company.owner.id ||
            application.job.company.members.some((member) => member.user.id === req.user?.id && member.role === 'manager');

        if (!isManagerOrOwner) {
            res.status(403).json({message: 'You are not a member of this company.'});
            return;
        }

        application.status = status === 'accepted' ? Status.ACCEPTED : Status.REJECTED;
        await applicationRepo.save(application);
        res.status(200).json({ message: `Application ${status} successfully.` });

    } catch (error) {
        console.log(error)
        res.status(500).json(error);
    }

})

export default router;