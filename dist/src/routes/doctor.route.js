"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../config/prisma");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
/**
 * Return public doctor information for authenticated patients.
 */
router.get("/", auth_middleware_1.authenticate, async (req, res) => {
    try {
        if (req.user?.role !== "PATIENT") {
            return res.status(403).json({
                message: "Only PATIENT users can view doctors"
            });
        }
        const doctors = await prisma_1.prisma.doctor.findMany({
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
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unable to fetch doctors";
        return res.status(400).json({ message });
    }
});
exports.default = router;
