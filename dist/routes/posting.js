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
const Company_1 = require("../entity/Company");
const CompanyMember_1 = require("../entity/CompanyMember");
const Roles_1 = require("../Roles");
const Job_1 = require("../entity/Job");
const router = express_1.default.Router();
router.post('/post/jobs/:companyId', checkAuth_1.checkAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const company_id = req.params.company_id;
    const { title, description, salary } = req.body;
    try {
        const companyMemberRepository = data_source_1.AppDataSource.getRepository(CompanyMember_1.CompanyMember);
        const companyRepository = data_source_1.AppDataSource.getRepository(Company_1.Company);
        const company = yield companyRepository.findOne({
            where: {
                company_id: company_id
            }
        });
        const managerMembership = yield companyMemberRepository.findOne({
            where: {
                user: { id: userId },
                company: { company_id: company_id },
                role: Roles_1.UserRole.MANAGER,
            }
        });
        if (!managerMembership) {
            res.status(403).json({ message: 'Access denied. Only managers can create jobs.' });
            return;
        }
        const jobRepository = data_source_1.AppDataSource.getRepository(Job_1.Job);
        const newJob = jobRepository.create({
            company: company,
            title,
            salary,
            description
        });
        yield jobRepository.save(newJob);
        res.status(201).json({ message: 'Job created successfully.', job: newJob });
    }
    catch (error) {
        res.status(500).send('Internal Server Error');
    }
}));
exports.default = router;
