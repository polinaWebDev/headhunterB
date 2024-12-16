import express, {Router} from "express";
import {checkAuth} from "../middleware/checkAuth";
import {AppDataSource} from "../data-source";
import {Company} from "../entity/Company";
import {CompanyMember} from "../entity/CompanyMember";
import {UserRole} from "../Roles";
import {Job} from "../entity/Job";
import {In} from "typeorm";

const router = express.Router();

router.post('/post/jobs/:companyId', checkAuth, async (req:any, res) => {
    const userId = req.user.id;
    const company_id = req.params.companyId;
    const {title, description, salary} = req.body;


    try {
        const companyMemberRepository =  AppDataSource.getRepository(CompanyMember);
        const companyRepository =  AppDataSource.getRepository(Company);

        const company = await companyRepository.findOne({
            where:{
                company_id: company_id
            }
        })

        const managerMembership = await companyMemberRepository.findOne({
            where:{
                user: { id: userId },
                company: {company_id : company_id},
                role:In([UserRole.MANAGER, UserRole.OWNER]),
            }
        });

        if(!managerMembership) {
            res.status(403).json({ message: 'Access denied. Only managers can create jobs.' });
            return
        }

        const jobRepository =  AppDataSource.getRepository(Job);

        const newJob = jobRepository.create({
            company: company!,
            title,
            salary,
            description
        })

        await jobRepository.save(newJob);
        res.status(201).json({message:'Job created successfully.', job: newJob })
    } catch (error) {
        res.status(500).send('Internal Server Error')
    }
})

export default router;