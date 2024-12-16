"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const checkAuth_1 = require("../middleware/checkAuth");
const data_source_1 = require("../data-source");
const Users_1 = require("../entity/Users");
const Company_1 = require("../entity/Company");
const CompanyMember_1 = require("../entity/CompanyMember");
const Roles_1 = require("../Roles");
const Job_1 = require("../entity/Job");
const router = express_1.default.Router();
router.put("/user/:id", checkAuth_1.checkAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.id;
    if (!userId) {
        res.status(400).json({ message: "ID пользователя не передан" });
        return;
    }
    const newName = req.body.name;
    try {
        const userRepo = data_source_1.AppDataSource.getRepository(Users_1.Users);
        const user = yield userRepo.findOne({ where: { id: userId } });
        if (!user) {
            res.status(404).json({ message: "Пользователь не найден" });
            return;
        }
        user.name = newName;
        yield userRepo.save(user);
        res.json({ message: "Updated successfully.", user });
    }
    catch (error) {
        console.error('Error during user registration:', error);
        res.status(500).send("Ошибка");
    }
}));
router.put('/company/:id', checkAuth_1.checkAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const companyId = Number(req.params.id);
    const userId = req.user.id;
    const newName = req.body.name;
    try {
        const companyRepository = data_source_1.AppDataSource.getRepository(Company_1.Company);
        const companyMemberRepository = data_source_1.AppDataSource.getRepository(CompanyMember_1.CompanyMember);
        const company = yield companyRepository.findOne({
            where: { company_id: companyId },
        });
        const managerMembership = yield companyMemberRepository.findOne({
            where: {
                user: { id: userId },
                company: company,
                role: Roles_1.UserRole.MANAGER,
            }
        });
        if (!managerMembership) {
            res.status(403).json({ message: 'Access denied. Only managers can change company name.' });
        }
        if (!company) {
            res.status(404).json({ message: 'Company not found' });
            return;
        }
        company.name = newName;
        yield companyRepository.save(company);
        res.json({ message: "Updated successfully.", company });
    }
    catch (error) {
        console.error('Error updated company name:', error);
        res.status(500);
    }
}));
router.put('/job/:jobId', checkAuth_1.checkAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { jobId } = req.params;
    const { title, description, salary } = req.body;
    try {
        const jobRepository = data_source_1.AppDataSource.getRepository(Job_1.Job);
        const companyMemberRepository = data_source_1.AppDataSource.getRepository(CompanyMember_1.CompanyMember);
        const job = yield jobRepository.findOne({
            where: { job_id: jobId },
            relations: ['company']
        });
        if (!job) {
            res.status(404).json({ message: 'Job not found' });
            return;
        }
        const managerMembership = yield companyMemberRepository.findOne({
            where: {
                user: { id: userId },
                company: { company_id: job.company.company_id },
                role: Roles_1.UserRole.MANAGER,
            }
        });
        if (!managerMembership) {
            res.status(403).json({ message: 'Access denied. Only managers can update jobs.' });
            return;
        }
        if (title !== undefined)
            job.title = title;
        if (description !== undefined)
            job.description = description;
        if (salary !== undefined)
            job.salary = salary;
        yield jobRepository.save(job);
        res.json({ message: "Updated successfully.", job });
    }
    catch (error) {
        console.error('Error updating:', error);
        res.status(500).send('Internal Server Error');
    }
}));
exports.default = router;
