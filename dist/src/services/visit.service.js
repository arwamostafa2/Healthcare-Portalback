"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchVisits = exports.getVisitById = exports.finishVisit = exports.addTreatment = exports.updateMedicalInformation = exports.startVisit = exports.reserveVisit = void 0;
const prisma_1 = require("../config/prisma");
/**
 * Reserve a visit for a patient with a doctor
 */
const reserveVisit = async (patientId, doctorId) => {
    // Check that patient exists
    const patient = await prisma_1.prisma.patient.findUnique({
        where: {
            id: patientId
        }
    });
    if (!patient) {
        throw new Error("Patient not found");
    }
    // Check that doctor exists
    const doctor = await prisma_1.prisma.doctor.findUnique({
        where: {
            id: doctorId
        }
    });
    if (!doctor) {
        throw new Error("Doctor not found");
    }
    // Check if doctor already has an active or queued visit.
    // The requirement states that each doctor must have at most one visit at a time.
    const activeVisit = await prisma_1.prisma.visit.findFirst({
        where: {
            doctorId,
            status: {
                in: ["PENDING", "IN_PROGRESS"]
            }
        }
    });
    if (activeVisit) {
        throw new Error("Doctor already has an active visit");
    }
    // Create new visit
    return prisma_1.prisma.visit.create({
        data: {
            visitNumber: String(Math.floor(Date.now() / 1000)),
            patientId,
            doctorId,
            status: "PENDING"
        }
    });
};
exports.reserveVisit = reserveVisit;
/**
 * Start a visit
 */
const startVisit = async (visitId, doctorId) => {
    // Find the visit
    const visit = await prisma_1.prisma.visit.findUnique({
        where: {
            id: visitId
        }
    });
    if (!visit) {
        throw new Error("Visit not found");
    }
    // Make sure this doctor owns the visit
    if (visit.doctorId !== doctorId) {
        throw new Error("You are not assigned to this visit");
    }
    // Visit must be pending
    if (visit.status !== "PENDING") {
        throw new Error("Visit cannot be started");
    }
    // A doctor cannot start a second active visit while one is already in progress.
    const activeVisit = await prisma_1.prisma.visit.findFirst({
        where: {
            doctorId,
            status: {
                in: ["PENDING", "IN_PROGRESS"]
            }
        }
    });
    if (activeVisit && activeVisit.id !== visitId) {
        throw new Error("Doctor already has an active visit");
    }
    // Start visit
    return prisma_1.prisma.visit.update({
        where: {
            id: visitId
        },
        data: {
            status: "IN_PROGRESS",
            startedAt: new Date()
        }
    });
};
exports.startVisit = startVisit;
/**
 * Update medical information
 */
const updateMedicalInformation = async (visitId, doctorId, diagnosis, notes) => {
    const visit = await prisma_1.prisma.visit.findUnique({
        where: {
            id: visitId
        }
    });
    if (!visit) {
        throw new Error("Visit not found");
    }
    if (visit.doctorId !== doctorId) {
        throw new Error("You are not assigned to this visit");
    }
    if (visit.status !== "IN_PROGRESS") {
        throw new Error("Visit is not active");
    }
    return prisma_1.prisma.visit.update({
        where: {
            id: visitId
        },
        data: {
            diagnosis,
            notes
        }
    });
};
exports.updateMedicalInformation = updateMedicalInformation;
/**
 * Add treatment to a visit
 */
const addTreatment = async (visitId, doctorId, name, price) => {
    const visit = await prisma_1.prisma.visit.findUnique({
        where: {
            id: visitId
        }
    });
    if (!visit) {
        throw new Error("Visit not found");
    }
    if (visit.doctorId !== doctorId) {
        throw new Error("You are not assigned to this visit");
    }
    if (visit.status !== "IN_PROGRESS") {
        throw new Error("Visit is not active");
    }
    if (price < 0) {
        throw new Error("Treatment price cannot be negative");
    }
    // Create treatment
    const treatment = await prisma_1.prisma.treatment.create({
        data: {
            visitId,
            name,
            price
        }
    });
    // Calculate visit total
    const total = await prisma_1.prisma.treatment.aggregate({
        where: {
            visitId
        },
        _sum: {
            price: true
        }
    });
    const totalAmount = total._sum.price ?? 0;
    // Update visit total
    await prisma_1.prisma.visit.update({
        where: {
            id: visitId
        },
        data: {
            totalAmount
        }
    });
    return treatment;
};
exports.addTreatment = addTreatment;
/**
 * Finish a visit
 */
const finishVisit = async (visitId, doctorId) => {
    const visit = await prisma_1.prisma.visit.findUnique({
        where: {
            id: visitId
        }
    });
    if (!visit) {
        throw new Error("Visit not found");
    }
    if (visit.doctorId !== doctorId) {
        throw new Error("You are not assigned to this visit");
    }
    if (visit.status !== "IN_PROGRESS") {
        throw new Error("Visit is not active");
    }
    return prisma_1.prisma.visit.update({
        where: {
            id: visitId
        },
        data: {
            status: "COMPLETED",
            finishedAt: new Date()
        }
    });
};
exports.finishVisit = finishVisit;
/**
 * Get visit details
 */
const getVisitById = async (visitId) => {
    const visit = await prisma_1.prisma.visit.findUnique({
        where: {
            id: visitId
        },
        include: {
            patient: {
                include: {
                    user: true
                }
            },
            doctor: {
                include: {
                    user: true
                }
            },
            treatments: true
        }
    });
    if (!visit) {
        throw new Error("Visit not found");
    }
    return visit;
};
exports.getVisitById = getVisitById;
/**
 * Search visits for Finance
 */
const searchVisits = async ({ doctorName, patientName, visitId }) => {
    return prisma_1.prisma.visit.findMany({
        where: {
            ...(visitId && {
                id: visitId
            }),
            ...(doctorName && {
                doctor: {
                    user: {
                        fullName: {
                            contains: doctorName,
                            mode: "insensitive"
                        }
                    }
                }
            }),
            ...(patientName && {
                patient: {
                    user: {
                        fullName: {
                            contains: patientName,
                            mode: "insensitive"
                        }
                    }
                }
            })
        },
        include: {
            doctor: {
                include: {
                    user: true
                }
            },
            patient: {
                include: {
                    user: true
                }
            },
            treatments: true
        },
        orderBy: {
            createdAt: "desc"
        }
    });
};
exports.searchVisits = searchVisits;
