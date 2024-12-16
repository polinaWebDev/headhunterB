"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const Users_1 = require("./entity/Users");
const Company_1 = require("./entity/Company");
const Job_1 = require("./entity/Job");
const Application_1 = require("./entity/Application");
const Resume_1 = require("./entity/Resume");
const CompanyMember_1 = require("./entity/CompanyMember");
exports.AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: "31011995pL_",
    database: "backend",
    entities: [Users_1.Users, Company_1.Company, Job_1.Job, Application_1.Application, Resume_1.Resume, CompanyMember_1.CompanyMember],
    synchronize: true,
    logging: false,
});
exports.AppDataSource.initialize()
    .then(() => {
})
    .catch((error) => console.log(error));
