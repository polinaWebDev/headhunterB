import express from "express";
import {AppDataSource} from "../data-source";
import {Company} from "../entity/Company";
import {Users} from "../entity/Users";
import {CompanyMember} from "../entity/CompanyMember";
import {checkAuth} from "../middleware/checkAuth";
import {Job} from "../entity/Job";

const router = express.Router();

router.get('/details/:companyId', async (req, res) => {
    const companyId = req.params.companyId;

    try {
        const companyRepo = AppDataSource.getRepository(Company);
        const company = await companyRepo.findOne({
            where: { company_id: companyId},
            relations: ['members', 'members.user', 'owner'],
        })


        if (!company) {
            res.status(404).json({message: 'Company not found'})
            return
        }

        const companyDetails = {
            ...company,
            members: company.members.map((member ) => ({
                role: member.role,
                user: {
                    id: member.user.id,
                    name: member.user.name,
                }
            })),
        }

        console.log(companyDetails)

        res.status(200).json(companyDetails);
    } catch (error) {
        console.log('Error fetching company details:', error);
        res.status(500).json({message: 'Server error'})
    }

})

router.put('/company/:companyId/user/:userId/role', checkAuth, async (req:any, res) => {
    const {companyId, userId} = req.params;
    const {role: newRole} = req.body;
    const currentUserId = req.user.id;

    try {
        const companyRepository = AppDataSource.getRepository(Company);
        const companyMemberRepository = AppDataSource.getRepository(CompanyMember);

        const company = await companyRepository.findOne({
            where: { company_id: companyId },
            relations: ['owner', 'members', 'members.user'],
        });

        if (!company) {
            res.status(404).json({ message: 'Company not found.' });
            return;
        }



        const isOwner = company.owner.id === currentUserId;

        const currentMembership =
            isOwner
                ? { user: { id: currentUserId }, role: 'owner' }
                : company.members.find((member) => member.user.id === currentUserId);

        if (!currentMembership) {
            res.status(403).json({ message: 'You are not a member of this company.' });
            return;
        }



        if (userId === currentUserId) {
            res.status(403).json({ message: "Cannot change your own role." });
            return;
        }

        const membershipToUpdate = company.members.find((member) => member.user.id === userId);
        if (!membershipToUpdate) {
            res.status(404).json({ message: 'User not found in the company.' });
            return;
        }

        membershipToUpdate.role = newRole;
        await companyMemberRepository.save(membershipToUpdate);
        console.log("User role update", membershipToUpdate)

        res.status(200).json({ message: 'Role updated successfully.' });
    } catch (error) {
        console.error('Error updating role:', error);
        res.status(500).json({ message: 'Internal Server Error.' });
    }
})


router.get('/jobs/:companyId', checkAuth, async (req, res) => {
    const companyId = req.params.companyId;

    try {
        const jobRepository = AppDataSource.getRepository(Job);
        const jobs = await jobRepository.find({
            where: {
                company: { company_id: companyId },
            },
            relations: ['company'],
        });

        console.log(jobs);
        res.status(200).json(jobs);
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).send('Internal Server Error');
    }
});


export default router;

