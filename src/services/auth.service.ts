// services/auth.service.ts

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { prisma } from "../config/prisma";
import { findUserByEmail } from "./user.service";

export const register = async (
  fullName: string,
  email: string,
  password: string
) => {
  // 1. Check if email already exists
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw new Error("Email already exists");
  }

  // 2. Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 3. Create patient user
const user = await prisma.user.create({
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


export const login = async (
  email: string,
  password: string
) => {
  // 1. Find user
  const user = await findUserByEmail(email);

  if (!user) {
    throw new Error("Invalid email or password");
  }

  // 2. Compare password with hashed password
  const isPasswordValid = await bcrypt.compare(
    password,
    user.password
  );

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  // 3. Create JWT
  const token = jwt.sign(
    {
      userId: user.id,
      role: user.role
    },

    process.env.JWT_SECRET!,

    {
      expiresIn: "1d"
    }
  );

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