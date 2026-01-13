// src/app/actions/approval-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { ApprovalDecision, ApprovalLevel, RequestStatus } from "@prisma/client";

export async function handleApproval(
  approvalId: string,
  decision: "APPROVED" | "REJECTED" | "RETURNED",
  comments?: string
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");

  // 1. Fetch approval and verify ownership
  const approval = await prisma.approval.findUnique({
    where: { id: approvalId },
  });

  if (!approval) throw new Error("Approval not found");
  if (approval.approverId !== session.user.id)
    throw new Error("Not your approval");
  if (approval.decision !== "PENDING")
    throw new Error("Approval already decided");

  // 2. Update the specific approval record
  const updatedApproval = await prisma.approval.update({
    where: { id: approvalId },
    data: {
      decision: decision as ApprovalDecision,
      comments: comments || null,
      decidedAt: new Date(),
    },
  });

  const { entityType, entityId } = approval;

  // 3. Update Request Status based on logic
  if (entityType === "REQUEST") {
    let nextStatus: RequestStatus | null = null;

    if (decision === "REJECTED") {
      nextStatus = "REJECTED";
    } else if (decision === "APPROVED") {
      // Logic for sequential progression
      if (approval.level === "L1") nextStatus = "PENDING_L2";
      else if (approval.level === "L2") nextStatus = "PENDING_L3";
      else if (approval.level === "L3") nextStatus = "APPROVED";
    } else if (decision === "RETURNED") {
      nextStatus = "DRAFT"; // Send back to user
    }

    if (nextStatus) {
      await prisma.request.update({
        where: { id: entityId },
        data: { status: nextStatus },
      });
    }

    revalidatePath(`/requests/${entityId}`);
  }

  // 4. Handle Customization Status
  else if (entityType === "CUSTOMIZATION") {
    if (decision === "REJECTED") {
      await prisma.customizationRequest.update({
        where: { id: entityId },
        data: { status: "REJECTED" },
      });
    } else if (decision === "APPROVED" && approval.level === "L3") {
      await prisma.customizationRequest.update({
        where: { id: entityId },
        data: { status: "APPROVED" },
      });
    }

    const customization = await prisma.customizationRequest.findUnique({
      where: { id: entityId },
      select: { targetVmId: true },
    });
    if (customization) revalidatePath(`/vms/${customization.targetVmId}`);
  }

  return { success: true, data: updatedApproval };
}
