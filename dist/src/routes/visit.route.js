"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../config/prisma");
const auth_middleware_1 = require("../middleware/auth.middleware");
const visit_service_1 = require("../services/visit.service");
const router = (0, express_1.Router)();
/**
 * PATIENT can reserve a visit with a doctor.
 * Doctors are protected by the business rule in the service layer.
 */
router.post("/reserve", auth_middleware_1.authenticate, async (req, res) => {
    try {
        if (req.user?.role !== "PATIENT") {
            return res.status(403).json({ message: "Only patients can reserve visits" });
        }
        const patient = await prisma_1.prisma.patient.findUnique({
            where: {
                userId: req.user.userId
            }
        });
        if (!patient) {
            return res.status(404).json({ message: "Patient profile not found" });
        }
        const { doctorId } = req.body;
        const visit = await (0, visit_service_1.reserveVisit)(patient.id, doctorId);
        return res.status(201).json(visit);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Reservation failed";
        return res.status(400).json({ message });
    }
});
/**
 * Doctor can start a visit only after the visit is pending and the doctor has no active visit.
 */
router.post("/:visitId/start", auth_middleware_1.authenticate, async (req, res) => {
    try {
        if (req.user?.role !== "DOCTOR") {
            return res.status(403).json({ message: "Only doctors can start visits" });
        }
        const visitId = Array.isArray(req.params.visitId)
            ? req.params.visitId[0]
            : req.params.visitId;
        const doctor = await prisma_1.prisma.doctor.findUnique({
            where: {
                userId: req.user.userId
            }
        });
        if (!doctor) {
            return res.status(404).json({ message: "Doctor profile not found" });
        }
        const visit = await (0, visit_service_1.startVisit)(visitId, doctor.id);
        return res.json(visit);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unable to start visit";
        return res.status(400).json({ message });
    }
});
/**
 * Doctor fills diagnosis and notes while the visit is in progress.
 */
router.put("/:visitId/medical-information", auth_middleware_1.authenticate, async (req, res) => {
    try {
        if (req.user?.role !== "DOCTOR") {
            return res.status(403).json({ message: "Only doctors can update medical information" });
        }
        const visitId = Array.isArray(req.params.visitId)
            ? req.params.visitId[0]
            : req.params.visitId;
        const doctor = await prisma_1.prisma.doctor.findUnique({
            where: {
                userId: req.user.userId
            }
        });
        if (!doctor) {
            return res.status(404).json({ message: "Doctor profile not found" });
        }
        const { diagnosis, notes } = req.body;
        const visit = await (0, visit_service_1.updateMedicalInformation)(visitId, doctor.id, diagnosis, notes);
        return res.json(visit);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unable to update medical information";
        return res.status(400).json({ message });
    }
});
/**
 * Doctor can add one or more treatments to a single visit.
 * Each treatment price is saved separately and the total is aggregated automatically.
 */
router.post("/:visitId/treatments", auth_middleware_1.authenticate, async (req, res) => {
    try {
        if (req.user?.role !== "DOCTOR") {
            return res.status(403).json({ message: "Only doctors can add treatments" });
        }
        const visitId = Array.isArray(req.params.visitId)
            ? req.params.visitId[0]
            : req.params.visitId;
        const doctor = await prisma_1.prisma.doctor.findUnique({
            where: {
                userId: req.user.userId
            }
        });
        if (!doctor) {
            return res.status(404).json({ message: "Doctor profile not found" });
        }
        const { name, price } = req.body;
        const treatment = await (0, visit_service_1.addTreatment)(visitId, doctor.id, name, price);
        return res.status(201).json(treatment);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unable to add treatment";
        return res.status(400).json({ message });
    }
});
/**
 * Doctor finishes the visit to mark it as completed.
 */
router.post("/:visitId/finish", auth_middleware_1.authenticate, async (req, res) => {
    try {
        if (req.user?.role !== "DOCTOR") {
            return res.status(403).json({ message: "Only doctors can finish visits" });
        }
        const visitId = Array.isArray(req.params.visitId)
            ? req.params.visitId[0]
            : req.params.visitId;
        const doctor = await prisma_1.prisma.doctor.findUnique({
            where: {
                userId: req.user.userId
            }
        });
        if (!doctor) {
            return res.status(404).json({ message: "Doctor profile not found" });
        }
        const visit = await (0, visit_service_1.finishVisit)(visitId, doctor.id);
        return res.json(visit);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unable to finish visit";
        return res.status(400).json({ message });
    }
});
/**
 * Finance role can search by doctor name, patient name and/or visit id.
 * The combined filters match the requirement where more than one field can be used together.
 */
router.get("/finance/search", auth_middleware_1.authenticate, async (req, res) => {
    try {
        if (req.user?.role !== "FINANCE") {
            return res.status(403).json({ message: "Only finance can search visits" });
        }
        const { doctorName, patientName, visitId } = req.query;
        const visits = await (0, visit_service_1.searchVisits)({
            doctorName: typeof doctorName === "string" ? doctorName : undefined,
            patientName: typeof patientName === "string" ? patientName : undefined,
            visitId: typeof visitId === "string" ? visitId : undefined
        });
        return res.json(visits);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Search failed";
        return res.status(400).json({ message });
    }
});
/**
 * Return all visits for the current authenticated patient.
 */
router.get("/my", auth_middleware_1.authenticate, async (req, res) => {
    try {
        if (req.user?.role !== "PATIENT") {
            return res.status(403).json({ message: "Only patients can view their visits" });
        }
        const patient = await prisma_1.prisma.patient.findUnique({
            where: {
                userId: req.user.userId
            }
        });
        if (!patient) {
            return res.status(404).json({ message: "Patient profile not found" });
        }
        const visits = await prisma_1.prisma.visit.findMany({
            where: {
                patientId: patient.id
            },
            orderBy: {
                createdAt: "desc"
            },
            select: {
                id: true,
                visitNumber: true,
                status: true,
                totalAmount: true,
                createdAt: true,
                doctor: {
                    select: {
                        id: true,
                        specialization: true,
                        user: {
                            select: {
                                fullName: true
                            }
                        }
                    }
                },
                treatments: {
                    select: {
                        id: true,
                        name: true,
                        price: true
                    }
                }
            }
        });
        return res.json(visits);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unable to fetch visits";
        return res.status(400).json({ message });
    }
});
/**
 * Return all visits assigned to the current authenticated doctor.
 */
router.get("/doctor/my", auth_middleware_1.authenticate, async (req, res) => {
    try {
        if (req.user?.role !== "DOCTOR") {
            return res.status(403).json({ message: "Only doctors can view their dashboard visits" });
        }
        const doctor = await prisma_1.prisma.doctor.findUnique({
            where: {
                userId: req.user.userId
            }
        });
        if (!doctor) {
            return res.status(404).json({ message: "Doctor profile not found" });
        }
        const visits = await prisma_1.prisma.visit.findMany({
            where: {
                doctorId: doctor.id
            },
            orderBy: {
                createdAt: "desc"
            },
            select: {
                id: true,
                visitNumber: true,
                status: true,
                diagnosis: true,
                notes: true,
                totalAmount: true,
                startedAt: true,
                finishedAt: true,
                createdAt: true,
                patient: {
                    select: {
                        id: true,
                        phone: true,
                        birthDate: true,
                        user: {
                            select: {
                                fullName: true
                            }
                        }
                    }
                },
                treatments: {
                    select: {
                        id: true,
                        name: true,
                        price: true
                    }
                }
            }
        });
        return res.json(visits);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unable to fetch doctor visits";
        return res.status(400).json({ message });
    }
});
/**
 * Read one visit with nested patient, doctor and treatments.
 */
router.get("/:visitId", auth_middleware_1.authenticate, async (req, res) => {
    try {
        const visitId = Array.isArray(req.params.visitId)
            ? req.params.visitId[0]
            : req.params.visitId;
        const visit = await (0, visit_service_1.getVisitById)(visitId);
        return res.json(visit);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unable to fetch visit";
        return res.status(400).json({ message });
    }
});
/**
 * Doctors and finance can view patients, which is useful for dashboard-style workflows.
 */
router.get("/patients", auth_middleware_1.authenticate, async (req, res) => {
    try {
        if (req.user?.role !== "DOCTOR" && req.user?.role !== "FINANCE") {
            return res.status(403).json({ message: "Unauthorized" });
        }
        const patients = await prisma_1.prisma.patient.findMany({
            include: {
                user: true,
                visits: true
            }
        });
        return res.json(patients);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load patients";
        return res.status(400).json({ message });
    }
});
exports.default = router;
