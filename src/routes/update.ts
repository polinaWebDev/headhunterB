import express from "express";
import {checkAuth} from "../middleware/checkAuth";
import {AppDataSource} from "../data-source";
import {Users} from "../entity/Users";
import {Company} from "../entity/Company";
import {CompanyMember} from "../entity/CompanyMember";
import {UserRole} from "../Roles";
import {Job} from "../entity/Job";

const router = express.Router()

router.put("/user/:id", checkAuth, async (req, res) => {

    const userId = req.params.id;


    if (!userId) {
        res.status(400).json({ message: "ID пользователя не передан" });
        return
    }

    const newName = req.body.name



    try {
        const userRepo = AppDataSource.getRepository(Users);
        const user = await userRepo.findOne({where: {id:userId}})

        if(!user) {
            res.status(404).json({message: "Пользователь не найден"})
            return
        }

        user.name = newName;
        await userRepo.save(user);

        res.json({message: "Updated successfully.", user})
    } catch (error) {
        console.error('Error during user registration:', error);
        res.status(500).send("Ошибка");
    }
});

router.put('/company/:id', checkAuth, async (req:any, res) => {
    const companyId = req.params.id;
    const userId = req.user.id;
    const newName = req.body.name;

    try {
        const companyRepository =  AppDataSource.getRepository(Company);
        const companyMemberRepository = AppDataSource.getRepository(CompanyMember);

        const company = await companyRepository.findOne({
            where: { company_id: companyId },
        });
        const managerMembership = await companyMemberRepository.findOne({
            where:{
                user: { id: userId },
                company: company!,
                role: UserRole.MANAGER,
            }
        });

        if (!managerMembership) {
            res.status(403).json({message: 'Access denied. Only managers can change company name.'})
        }


        if (!company) {
            res.status(404).json({message: 'Company not found'})
            return
        }

        company.name = newName

        await companyRepository.save(company)
        res.json({message: "Updated successfully.", company})
    } catch (error) {
        console.error('Error updated company name:', error);
        res.status(500)
    }

})
export default router;

router.put('/job/:jobId', checkAuth, async (req:any, res) => {
    const userId = req.user.id;
    const {jobId} = req.params;
    const {title, description, salary} = req.body;

    try {
        const jobRepository =  AppDataSource.getRepository(Job);
        const companyMemberRepository =  AppDataSource.getRepository(CompanyMember);

        const job = await jobRepository.findOne({
            where: {job_id: jobId},
            relations: ['company']
        });

        if (!job) {
            res.status(404).json({message: 'Job not found'})
            return
        }

        const managerMembership = await companyMemberRepository.findOne({
            where: {
                user: { id: userId },
                company: { company_id: job.company.company_id },
                role: UserRole.MANAGER,
            }
        });

        if(!managerMembership) {
            res.status(403).json({message: 'Access denied. Only managers can update jobs.'})
            return
        }

        if (title !== undefined) job.title = title;
        if (description !== undefined) job.description = description;
        if (salary !== undefined) job.salary = salary;

        await jobRepository.save(job)

        res.json({message: "Updated successfully.", job})
        
    } catch (error) {
        console.error('Error updating:', error);
        res.status(500).send('Internal Server Error')
    }
})