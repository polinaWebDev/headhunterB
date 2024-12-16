import express, {Router} from "express";
import {checkAuth} from "../middleware/checkAuth";
import {AppDataSource} from "../data-source";
import {Users} from "../entity/Users";
import {AuthenticatedRequest} from "./application";

const router = express.Router();


router.get('/profile', checkAuth, async (req:AuthenticatedRequest, res) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized: No user found' });
        return;
    }

    const userId = req.user.id;

    if (!userId) {
        res.status(404).send("Пользователь не найден");
        return
    }
    try {
        const userRepository = AppDataSource.getRepository(Users)
        console.log(req.user);
        const user = await userRepository.findOne({
            where: {id: userId},
            select: ['name', 'email', 'id']
        });
        console.log(user);

        if (!user) {
             res.status(404).json({ message: 'User not found' });
             return
        }

        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: 'Something went wrong' });
    }
})
export default router;