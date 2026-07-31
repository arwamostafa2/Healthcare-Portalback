"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = exports.createUser = exports.findUserById = exports.findUserByEmail = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = require("../config/prisma");
const findUserByEmail = async (email) => {
    return prisma_1.prisma.user.findUnique({
        where: {
            email
        }
    });
};
exports.findUserByEmail = findUserByEmail;
const findUserById = async (id) => {
    return prisma_1.prisma.user.findUnique({
        where: {
            id
        }
    });
};
exports.findUserById = findUserById;
const createUser = async (data) => {
    return prisma_1.prisma.user.create({
        data
    });
};
exports.createUser = createUser;
const register = async (data) => {
    const existingUser = await (0, exports.findUserByEmail)(data.email);
    if (existingUser) {
        throw new Error("Email already exists");
    }
    const hashedPassword = await bcrypt_1.default.hash(data.password, 10);
    const user = await (0, exports.createUser)({
        fullName: data.fullName,
        email: data.email,
        password: hashedPassword,
        role: "PATIENT"
    });
    return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
    };
};
exports.register = register;
