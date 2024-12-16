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
const Company_1 = require("../entity/Company");
const Users_1 = require("../entity/Users");
const data_source_1 = require("../data-source");
const checkAuth_1 = require("../middleware/checkAuth");
const Roles_1 = require("../Roles");
const CompanyMember_1 = require("../entity/CompanyMember");
const router = express_1.default.Router();
router.post('/company', checkAuth_1.checkAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name } = req.body;
    const userId = req.params.id;
    try {
        const companyRepository = data_source_1.AppDataSource.getRepository(Company_1.Company);
        const userRepository = data_source_1.AppDataSource.getRepository(Users_1.Users);
        const companyMemberRepository = data_source_1.AppDataSource.getRepository(CompanyMember_1.CompanyMember);
        const user = yield userRepository.findOne({ where: { id: userId } });
        if (!user) {
            res.status(404).send("Пользователь не найден");
            return;
        }
        user.role = Roles_1.UserRole.MANAGER;
        yield userRepository.save(user);
        const newCompany = companyRepository.create({
            name: name,
            members: [user]
        });
        const savedCompany = yield companyRepository.save(newCompany);
        const companyMember = new CompanyMember_1.CompanyMember();
        companyMember.company = savedCompany;
        companyMember.user = user;
        companyMember.role = Roles_1.UserRole.MANAGER;
        yield companyMemberRepository.save(companyMember);
        res.json({ message: "Updated successfully.", newCompany });
    }
    catch (error) {
        console.error('Error during user registration:', error);
        res.status(500);
    }
}));
exports.default = router;
