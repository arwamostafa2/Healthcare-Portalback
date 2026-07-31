import { prisma } from "../config/prisma";

/**
 * Reserve a visit for a patient with a doctor
 */
export const reserveVisit = async (
  patientId: string,
  doctorId: string
) => {
  // Check that patient exists
  const patient = await prisma.patient.findUnique({
    where: {
      id: patientId
    }
  });

  if (!patient) {
    throw new Error("Patient not found");
  }

  // Check that doctor exists
  const doctor = await prisma.doctor.findUnique({
    where: {
      id: doctorId
    }
  });

  if (!doctor) {
    throw new Error("Doctor not found");
  }

  // Check if doctor already has an active or queued visit.
  // The requirement states that each doctor must have at most one visit at a time.
  const activeVisit = await prisma.visit.findFirst({
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
  return prisma.visit.create({
    data: {
      visitNumber: String(Math.floor(Date.now() / 1000)),
      patientId,
      doctorId,
      status: "PENDING"
    }
  });
};

/**
 * Start a visit
 */
export const startVisit = async (
  visitId: string,
  doctorId: string
) => {
  // Find the visit
  const visit = await prisma.visit.findUnique({
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
  const activeVisit = await prisma.visit.findFirst({
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
  return prisma.visit.update({
    where: {
      id: visitId
    },
    data: {
      status: "IN_PROGRESS",
      startedAt: new Date()
    }
  });
};

/**
 * Update medical information
 */
export const updateMedicalInformation = async (
  visitId: string,
  doctorId: string,
  diagnosis: string,
  notes?: string
) => {
  const visit = await prisma.visit.findUnique({
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

  return prisma.visit.update({
    where: {
      id: visitId
    },
    data: {
      diagnosis,
      notes
    }
  });
};

/**
 * Add treatment to a visit
 */
export const addTreatment = async (
  visitId: string,
  doctorId: string,
  name: string,
  price: number
) => {
  const visit = await prisma.visit.findUnique({
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
  const treatment = await prisma.treatment.create({
    data: {
      visitId,
      name,
      price
    }
  });

  // Calculate visit total
  const total = await prisma.treatment.aggregate({
    where: {
      visitId
    },
    _sum: {
      price: true
    }
  });

  const totalAmount = total._sum.price ?? 0;

  // Update visit total
  await prisma.visit.update({
    where: {
      id: visitId
    },
    data: {
      totalAmount
    }
  });

  return treatment;
};

/**
 * Finish a visit
 */
export const finishVisit = async (
  visitId: string,
  doctorId: string
) => {
  const visit = await prisma.visit.findUnique({
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

  return prisma.visit.update({
    where: {
      id: visitId
    },
    data: {
      status: "COMPLETED",
      finishedAt: new Date()
    }
  });
};

/**
 * Get visit details
 */
export const getVisitById = async (
  visitId: string
) => {
  const visit = await prisma.visit.findUnique({
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

/**
 * Search visits for Finance
 */
export const searchVisits = async ({
  doctorName,
  patientName,
  visitId
}: {
  doctorName?: string;
  patientName?: string;
  visitId?: string;
}) => {
  return prisma.visit.findMany({
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