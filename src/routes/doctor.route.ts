import { Router } from "express";
import { prisma } from "../config/prisma";
import { authenticate, AuthRequest } from "../middleware/auth.middleware";

const router = Router();

/**
 * Return public doctor information for authenticated patients.
 */
router.get("/", authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== "PATIENT") {
      return res.status(403).json({
        message: "Only PATIENT users can view doctors"
      });
    }

    const doctors = await prisma.doctor.findMany({
      select: {
        id: true,
        specialization: true,
        user: {
          select: {
            fullName: true
          }
        }
      }
    });

    const response = doctors.map((doctor) => ({
      id: doctor.id,
      name: doctor.user.fullName,
      specialization: doctor.specialization ?? "General"
    }));

    return res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch doctors";
    return res.status(400).json({ message });
  }
});

export default router;
