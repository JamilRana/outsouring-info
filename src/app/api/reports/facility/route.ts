// app/reports/actions.ts
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";
import prisma from "../../../../lib/prisma";
import { submissionSchema } from "../../../../lib/validation";

export async function getReportData(
  page: number = 1,
  limit: number = 10,
  filters: {
    facilityCode?: string;
    designationId?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    throw new Error("Unauthorized");
  }

  const skip = (page - 1) * limit;

  // Base where clause with filters
  const where: any = {};

  // Apply filters
  if (filters.facilityCode) {
    where.facilityCode = {
      contains: filters.facilityCode,
      mode: "insensitive",
    };
  }

  if (filters.designationId) {
    where.designationId = filters.designationId;
  }

  if (filters.dateFrom || filters.dateTo) {
    where.submittedAt = {};
    if (filters.dateFrom) {
      where.submittedAt.gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      where.submittedAt.lte = new Date(filters.dateTo);
    }
  }

  // Role-based data access
  if (session.user.role === "SUBMITTER") {
    // Submitters can only see their own data
    where.userId = session.user.id;
  }
  // Exporters see all data (no additional where clause needed)

  const [submissions, total] = await Promise.all([
    prisma.submission.findMany({
      where,
      include: {
        designation: {
          select: { id: true, name: true, category: true },
        },
        user: {
          select: {
            facilityName: true,
            division: true,
            district: true,
            upazila: true,
          },
        },
      },
      orderBy: { submittedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.submission.count({ where }),
  ]);

  return {
    data: submissions,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalRecords: total,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  };
}

export async function getDesignations() {
  return prisma.designation.findMany({
    select: { id: true, name: true, category: true },
    orderBy: { name: "asc" },
  });
}

export async function getFacilities() {
  // Only show facilities relevant to user's role
  const session = await getServerSession(authOptions);

  if (session?.user?.role === "SUBMITTER") {
    // Submitters only see their own facility
    return prisma.submission.groupBy({
      by: ["facilityCode", "facilityName"],
      where: { userId: session.user.id },
      orderBy: { facilityName: "asc" },
    });
  }

  // Exporters see all facilities
  return prisma.submission.groupBy({
    by: ["facilityCode", "facilityName"],
    orderBy: { facilityName: "asc" },
  });
}

export async function getSubmissionById(id: string) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "SUBMITTER") {
    throw new Error("Unauthorized");
  }

  const submission = await prisma.submission.findFirst({
    where: {
      id,
      userId: session.user.id, // Only allow editing own submissions
    },
    include: {
      designation: true,
    },
  });

  if (!submission) {
    throw new Error("Submission not found");
  }

  return submission;
}

export async function updateSubmission(data: any) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "SUBMITTER") {
    throw new Error("Unauthorized");
  }

  // Validate input
  const validatedData = submissionSchema.parse(data);

  const { id, p_designation, salary, total_post, male, female } = validatedData;

  // Verify submission belongs to user
  const existing = await prisma.submission.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
  });

  if (!existing) {
    throw new Error("Submission not found");
  }

  const totalManpower = male + female;
  const vacant = Math.max(0, total_post - totalManpower);

  return prisma.submission.update({
    where: { id },
    data: {
      designationId: p_designation,
      consolidatedSalary: salary,
      totalPost: total_post,
      male,
      female,
      totalManpower,
      vacant,
    },
  });
}
