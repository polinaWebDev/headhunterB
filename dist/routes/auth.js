"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const Users_1 = require("../entity/Users");
const express_1 = require("express");
const data_source_1 = require("../data-source");
const jwt = __importStar(require("jsonwebtoken"));
const router = (0, express_1.Router)();
const userRepository = data_source_1.AppDataSource.getRepository(Users_1.Users);
router.post('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, name } = req.body;
    console.log('Received data:', { email, password, name });
    try {
        const existingUser = yield userRepository.findOneBy({ email });
        if (existingUser) {
            res.status(400).send("Users already exists");
            return;
        }
        const user = new Users_1.Users();
        user.email = email;
        user.password = password;
        user.name = name;
        console.log('Saving user to the database:', user);
        yield userRepository.save(user);
        res.status(201).send("Users registered");
        return;
    }
    catch (error) {
        console.error('Error during user registration:', error);
        res.status(500).send("Users already registered");
        return;
    }
}));
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        const user = yield userRepository.findOneBy({ email });
        if (!user) {
            res.status(400).send("Пользователь не существует");
            return;
        }
        if (!user.checkIfPasswordIsValid(password)) {
            res.status(401).send("Users already exists");
            return;
        }
        const token = jwt.sign({ userId: user.id, email: user.email }, 'SECRET_KEY', { expiresIn: '1h' });
        res.json({ token });
        return;
    }
    catch (error) {
        res.status(500).send("Users already exists");
        return;
    }
}));
exports.default = router;
