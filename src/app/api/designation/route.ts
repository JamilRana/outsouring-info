import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function GET() {
  try {
    const designations = await prisma.designation.findMany({
      select: {
        id: true,
        name: true,
        category: true,
      },
      orderBy: { name: "asc" },
    });

    // Return full objects instead of just names
    return NextResponse.json(designations);
  } catch (error) {
    console.error("Designation fetch error:", error);
    return NextResponse.json(
      { error: "Failed to load designations" },
      { status: 500 }
    );
  }
}
