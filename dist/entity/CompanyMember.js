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
exports.CompanyMember = void 0;
const typeorm_1 = require("typeorm");
const Company_1 = require("./Company");
const Users_1 = require("./Users");
const Roles_1 = require("../Roles");
let CompanyMember = class CompanyMember {
    get companyName() {
        var _a;
        return ((_a = this.company) === null || _a === void 0 ? void 0 : _a.name) || ''; // Возвращает имя компании, если она существует
    }
};
exports.CompanyMember = CompanyMember;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], CompanyMember.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Company_1.Company, (company) => company.members),
    (0, typeorm_1.JoinColumn)({ name: 'company_id', referencedColumnName: 'company_id' }),
    __metadata("design:type", Company_1.Company)
], CompanyMember.prototype, "company", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Users_1.Users, (user) => user.memberships),
    __metadata("design:type", Users_1.Users)
], CompanyMember.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: Roles_1.UserRole,
        default: Roles_1.UserRole.MEMBER
    }),
    __metadata("design:type", String)
], CompanyMember.prototype, "role", void 0);
exports.CompanyMember = CompanyMember = __decorate([
    (0, typeorm_1.Entity)()
], CompanyMember);
