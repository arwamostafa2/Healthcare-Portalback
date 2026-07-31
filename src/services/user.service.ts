import bcrypt from "bcrypt";

import { prisma } from "../config/prisma";

export const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({
    where: {
      email
    }
  });
};

export const findUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: {
      id
    }
  });
};

export const createUser = async (data: {
  fullName: string;
  email: string;
  password: string;
  role: "PATIENT" | "DOCTOR" | "FINANCE";
}) => {
  return prisma.user.create({
    data
  });
};


export const register = async (data: {
  fullName: string;
  email: string;
  password: string;
}) => {
  const existingUser = await findUserByEmail(data.email);

  if (existingUser) {
    throw new Error("Email already exists");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await createUser({
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