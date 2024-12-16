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
const router = express_1.default.Router();
router.get('/profile', checkAuth_1.checkAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('sss');
    const userRepository = data_source_1.AppDataSource.getRepository(Users_1.Users);
    try {
        const userId = req.user.id;
        const user = yield userRepository.findOne({
            where: { id: userId },
            select: ['name', 'email']
        });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.status(200).json(user);
    }
    catch (err) {
        res.status(500).json({ message: 'Something went wrong' });
    }
}));
exports.default = router;
