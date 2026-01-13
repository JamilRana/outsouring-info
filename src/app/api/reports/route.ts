import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "../../../lib/authOptions";

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "EXPORTER") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const submissions = await prisma.submission.findMany({
      orderBy: { submittedAt: "desc" },
    });

    return Response.json(submissions);
  } catch (error) {
    console.error("Reports fetch error:", error);
    return Response.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
