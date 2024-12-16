"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Users = void 0;
const typeorm_1 = require("typeorm");
const Company_1 = require("./Company");
const Application_1 = require("./Application");
const Resume_1 = require("./Resume");
const CompanyMember_1 = require("./CompanyMember");
const Roles_1 = require("../Roles");
let Users = class Users {
    checkIfPasswordIsValid(password) {
        return this.password === password;
    }
};
exports.Users = Users;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Users.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Users.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Users.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Users.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Users.prototype, "resume_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: Roles_1.UserRole,
        default: Roles_1.UserRole.USER
    }),
    __metadata("design:type", String)
], Users.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => Company_1.Company, (company) => company.members),
    __metadata("design:type", Array)
], Users.prototype, "companies", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Application_1.Application, (application) => application.user, { nullable: true }),
    __metadata("design:type", Array)
], Users.prototype, "applications", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => Resume_1.Resume, (resume) => resume.user, { nullable: true }),
    __metadata("design:type", Resume_1.Resume)
], Users.prototype, "resume", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => CompanyMember_1.CompanyMember, (membership) => membership.user),
    __metadata("design:type", Array)
], Users.prototype, "memberships", void 0);
exports.Users = Users = __decorate([
    (0, typeorm_1.Entity)()
], Users);
