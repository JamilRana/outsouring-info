// src/app/actions/deploy-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { Prisma, RequestStatus, VmStatus } from "@prisma/client";

export async function provisionRequest(
  requestId: string,
  vms: {
    hostname: string;
    ipAddress: string;
    publicIpAddress?: string | null;
  }[]
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");

  // Check if user has DC_OPS or ADMIN role
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      roles: {
        include: { role: { select: { name: true } } },
      },
    },
  });

  const hasDeployRole = user?.roles.some((r) =>
    ["DC_OPS", "ADMIN"].includes(r.role.name)
  );

  if (!hasDeployRole)
    throw new Error("Only infrastructure team can provision VMs");

  const request = await prisma.request.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      status: true,
      requesterId: true,
      quantity: true,
      vcpu: true,
      ramGb: true,
      storageGb: true,
      osName: true,
      osVersion: true,
      networkAccess: true,
      firewallPorts: true,
      raid: true,
    },
  });

  if (!request) throw new Error("Request not found");
  if (request.status !== "APPROVED")
    throw new Error("Request must be approved");

  if (vms.length !== request.quantity) {
    throw new Error(`Expected ${request.quantity} VM(s), got ${vms.length}`);
  }

  const vmInstances = vms.map((vm, index) => ({
    requestId: request.id,
    ownerId: request.requesterId,
    sequenceNumber: index + 1,
    hostname: vm.hostname,
    ipAddress: vm.ipAddress,
    publicIpAddress: vm.publicIpAddress || null,
    vcpu: request.vcpu || 2,
    ramGb: request.ramGb || 4,
    storageGb: request.storageGb || 50,
    osName: request.osName || "Ubuntu",
    osVersion: request.osVersion || "22.04",
    networkAccess: request.networkAccess,
    firewallPorts:
      request.firewallPorts === null ? Prisma.JsonNull : request.firewallPorts,
    raid: request.raid,
    status: "ACTIVE" as VmStatus,
    provisionedAt: new Date(),
  }));

  await prisma.$transaction([
    prisma.vmInstance.createMany({ data: vmInstances }),
    prisma.request.update({
      where: { id: requestId },
      data: {
        status: "PROVISIONED" as RequestStatus,
        provisionedAt: new Date(),
      },
    }),
  ]);

  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/inventory/vms");
}
