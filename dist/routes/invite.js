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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const checkAuth_1 = require("../middleware/checkAuth");
const data_source_1 = require("../data-source");
const CompanyMember_1 = require("../entity/CompanyMember");
const Users_1 = require("../entity/Users");
const Roles_1 = require("../Roles");
const router = (0, express_1.Router)();
router.post('/invite', checkAuth_1.checkAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const inviterId = req.params.id;
    try {
        const companyMemberRepository = data_source_1.AppDataSource.getRepository(CompanyMember_1.CompanyMember);
        const userRepository = data_source_1.AppDataSource.getRepository(Users_1.Users);
        const userToInvite = yield userRepository.findOne({ where: { id: inviterId } });
        if (!userToInvite) {
            res.status(404).send("Пользователь не найден");
            return;
        }
        const inviterMembership = yield companyMemberRepository.findOne({
            where: {
                user: { id: inviterId },
                role: Roles_1.UserRole.MANAGER,
            },
            relations: ['company'],
        });
        if (!inviterMembership) {
            res.status(403).send('Вы не являетесь менеджером ни в одной компании');
            return;
        }
        const company = inviterMembership.company;
        const existingMember = yield companyMemberRepository.findOne({
            where: { id: userToInvite.id, company: company },
        });
        if (existingMember) {
            res.status(409).send("Пользователь уже существует");
        }
        const newCompanyMember = new CompanyMember_1.CompanyMember();
        newCompanyMember.company = company;
        newCompanyMember.user = userToInvite;
        newCompanyMember.role = Roles_1.UserRole.MEMBER;
        yield companyMemberRepository.save(newCompanyMember);
        res.json({ message: "Пользователь приглашен" });
    }
    catch (error) {
        console.error('Ошибка при отправке приглашения:', error);
        res.status(500).send("Внутренняя ошибка сервера");
    }
}));
exports.default = router;
