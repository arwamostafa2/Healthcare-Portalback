import { Router } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../config/prisma";
import { authenticate, AuthRequest } from "../middleware/auth.middleware";
import { findUserById } from "../services/user.service";
import { login as loginUser } from "../services/auth.service";

const router = Router();

/**
 * Register a new user account. The role decides which nested profile is created.
 * PATIENT -> patient profile
 * DOCTOR -> doctor profile
 * FINANCE -> finance profile
 */
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        message: "fullName, email and password are required"
      });
    }

    const normalizedRole = (role ?? "PATIENT").toUpperCase();

    if (!["PATIENT", "DOCTOR", "FINANCE"].includes(normalizedRole)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email
      }
    });

    if (existingUser) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        password: await bcrypt.hash(password, 10),
        role: normalizedRole,
        ...(normalizedRole === "DOCTOR" && {
          doctor: {
            create: {
              specialization: "General"
            }
          }
        }),
        ...(normalizedRole === "PATIENT" && {
          patient: {
            create: {}
          }
        }),
        ...(normalizedRole === "FINANCE" && {
          finance: {
            create: {}
          }
        })
      },
      include: {
        patient: true,
        doctor: true,
        finance: true
      }
    });

    return res.status(201).json({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    return res.status(400).json({ message });
  }
});

/**
 * Log in with an email and password. The JWT contains the user id and role.
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const result = await loginUser(email, password);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    return res.status(401).json({ message });
  }
});

/**
 * Fetch the current user profile from the authenticated token.
 */
router.get("/me", authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await findUserById(req.user!.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load profile";
    return res.status(400).json({ message });
  }
});

export default router;
