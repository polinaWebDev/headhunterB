import {Users} from "../entity/Users";
import {response, Router} from "express";
import {AppDataSource} from "../data-source";
import * as jwt from 'jsonwebtoken'



const router = Router();
const userRepository =  AppDataSource.getRepository(Users);


router.post('/register', async (req, res) => {
    const { email, password, name } = req.body;

    try {
        const existingUser = await userRepository.findOneBy({ email });
        if (existingUser) {
            res.status(400).send("Users already exists");
            return
        }

        const user = new Users();
        user.email = email;
        user.password = password;
        user.name = name;


        await userRepository.save(user);
        res.status(201).send("Users registered");
        return
    } catch (error) {
        console.error('Error during user registration:', error);
        res.status(500).send("Users already registered");
        return
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await userRepository.findOneBy({ email });

        if (!user) {
            res.status(400).send("Пользователь не существует");
            return
        }

        if (!user.checkIfPasswordIsValid(password)) { //?
            res.status(401).send("Users already exists");
            return
        }


        const token = jwt.sign({ id: user.id, email: user.email }, 'SECRET_KEY'); //?
        res.json({token, userId: user.id});
        return
    } catch (error) {
        res.status(500).send("Users already exists");
        return
    }
});


export default router;