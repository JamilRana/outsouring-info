// app/api/submitForm/route.ts
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/authOptions";
import prisma from "../../../lib/prisma";

export async function POST(req: NextRequest) {
  // Log raw request for debugging
  const rawBody = await req.text();
  console.log("Raw request body:", rawBody);

  try {
    const data = JSON.parse(rawBody);
    console.log("Parsed submission data:", data);
  } catch (e) {
    console.error("Invalid JSON:", e);
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  console.log("Session user:", session?.user);

  if (!session || session.user.role !== "SUBMITTER") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = JSON.parse(rawBody);
    const { p_designation, salary, total_post, male, female } = data;

    // Validate required fields
    if (!p_designation) {
      console.error("Missing designation ID");
      return Response.json(
        { error: "Designation is required" },
        { status: 400 }
      );
    }
    if (typeof salary !== "number" || salary <= 0) {
      console.error("Invalid salary:", salary);
      return Response.json({ error: "Valid salary required" }, { status: 400 });
    }
    if (!total_post || total_post <= 0) {
      console.error("Invalid total_post:", total_post);
      return Response.json(
        { error: "Valid total posts required" },
        { status: 400 }
      );
    }

    const totalManpower = (male || 0) + (female || 0);
    const vacant = Math.max(0, total_post - totalManpower);

    await prisma.submission.create({
      data: {
        userId: session.user.id,
        designationId: p_designation,
        consolidatedSalary: salary,
        totalPost: total_post,
        male: male || 0,
        female: female || 0,
        totalManpower,
        vacant,
        facilityCode: session.user.facilityCode || "",
        facilityName: session.user.facilityName || "",
      },
    });

    return Response.json({ success: true });
  } catch (error: any) {
    console.error("Submission error:", error);
    return Response.json(
      {
        error: "Submission failed",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
