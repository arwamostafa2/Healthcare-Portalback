"use strict";
// services/auth.service.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../config/prisma");
const user_service_1 = require("./user.service");
const register = async (fullName, email, password) => {
    // 1. Check if email already exists
    const existingUser = await (0, user_service_1.findUserByEmail)(email);
    if (existingUser) {
        throw new Error("Email already exists");
    }
    // 2. Hash password
    const hashedPassword = await bcrypt_1.default.hash(password, 10);
    // 3. Create patient user
    const user = await prisma_1.prisma.user.create({
        data: {
            fullName,
            email,
            password: hashedPassword,
            role: "PATIENT",
            patient: {
                create: {}
            }
        }
    });
    // 4. Never return password
    return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
    };
};
exports.register = register;
const login = async (email, password) => {
    // 1. Find user
    const user = await (0, user_service_1.findUserByEmail)(email);
    if (!user) {
        throw new Error("Invalid email or password");
    }
    // 2. Compare password with hashed password
    const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
    if (!isPasswordValid) {
        throw new Error("Invalid email or password");
    }
    // 3. Create JWT
    const token = jsonwebtoken_1.default.sign({
        userId: user.id,
        role: user.role
    }, process.env.JWT_SECRET, {
        expiresIn: "1d"
    });
    // 4. Return token + safe user data
    return {
        token,
        user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            role: user.role
        }
    };
};
exports.login = login;
