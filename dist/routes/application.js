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
const Job_1 = require("../entity/Job");
const Application_1 = require("../entity/Application");
const status_1 = require("../status");
const router = express_1.default.Router();
router.post("/application/:jobId", checkAuth_1.checkAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { jobId } = req.params;
    const { coverLetter } = req.body;
    try {
        const userRepository = data_source_1.AppDataSource.getRepository(Users_1.Users);
        const jobRepository = data_source_1.AppDataSource.getRepository(Job_1.Job);
        const applicationRepository = data_source_1.AppDataSource.getRepository(Application_1.Application);
        const user = yield userRepository.findOne({
            where: {
                id: userId,
            }
        });
        const job = yield jobRepository.findOne({
            where: {
                job_id: Number(jobId)
            }
        });
        if (!user || !job) {
            res.status(404).json({ message: 'Job or User not found' });
            return;
        }
        const existingApplication = yield applicationRepository.findOne({
            where: {
                user: { id: userId },
                job_id: jobId
            }
        });
        if (existingApplication) {
            res.status(400).json({ message: 'You have already applied for this job' });
            return;
        }
        const newApplication = applicationRepository.create({
            user: user,
            job_id: jobId,
            coverLetter: coverLetter,
            status: status_1.Status.PENDING
        });
        yield applicationRepository.save(newApplication);
        res.status(200).json({ message: 'Application saved' });
        return;
    }
    catch (error) {
        res.status(500).send('Internal Server Error');
        return;
    }
}));
exports.default = router;
