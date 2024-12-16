import express from "express";
import {AppDataSource} from "../data-source";
import {Resume} from "../entity/Resume";
import {checkAuth} from "../middleware/checkAuth";
import {Users} from "../entity/Users";
import {AuthenticatedRequest} from "./application";

const router = express.Router();


router.get('/resumes', checkAuth, async (req:AuthenticatedRequest, res) => {

    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized: No user found' });
        return;
    }

    try {
        const resumeRepo = AppDataSource.getRepository(Resume);
        const resumes = await resumeRepo.find({
            where: { userId: { id: req.user.id } },
        });

        res.status(200).json(resumes);
    } catch (error) {
        console.error('Error fetching resumes:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/resumes/:id', checkAuth, async (req:AuthenticatedRequest, res) => {
    const { id } = req.params;

    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized: No user found' });
        return;
    }

    try {
        const resumeRepo = AppDataSource.getRepository(Resume);
        const resume = await resumeRepo.findOne({
            where: { resume_id: +id, userId: { id: req.user.id } },
        });

        if (!resume) {
            res.status(404).json({ message: 'Resume not found' });
            return
        }

        res.status(200).json(resume);
    } catch (error) {
        console.error('Error fetching resume:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/resumes', checkAuth, async (req, res) => {
    const { title, content } = req.body;

    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized: No user found' });
        return;
    }

    try {
        const resumeRepo = AppDataSource.getRepository(Resume);
        const newResume = resumeRepo.create({
            title,
            content,
            userId: req.user,
        });

        await resumeRepo.save(newResume);

        res.status(201).json(newResume);
    } catch (error) {
        console.error('Error creating resume:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.put('/resumes/:id', checkAuth, async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const { title, content } = req.body;

    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized: No user found' });
        return;
    }

    try {
        const resumeRepository = AppDataSource.getRepository(Resume);

        // Найти резюме по id и пользователю
        const resume = await resumeRepository.findOne({
            where: { resume_id: Number(id), userId: { id: req.user.id } },
        });

        if (!resume) {
            res.status(404).json({ message: 'Resume not found or access denied' });
            return
        }

        // Обновить поля
        resume.title = title;
        resume.content = content;

        // Сохранить изменения
        await resumeRepository.save(resume);

        res.status(200).json({ message: 'Resume updated successfully' });
    } catch (error) {
        console.error('Error updating resume:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;







































