// src/actions/vm-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { VmStatus, RequestStatus, Prisma } from "@prisma/client";

// ==============
// Helper: Create Audit Log
// ==============
async function createAuditLog(
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  details?: Record<string, unknown>,
  vmId?: string
) {
  await prisma.auditLog.create({
    data: {
      actorId,
      action,
      entityType,
      entityId,
      details: details ? JSON.stringify(details) : undefined,
      vmId,
    },
  });
}

// ==============
// Schemas
// ==============

const vmBaseSchema = z.object({
  requestId: z.string().uuid(),
  sequenceNumber: z.number().int().min(1),
  ownerId: z.string().uuid().optional().nullable(),
  hostname: z.string().optional().nullable(),
  subdomain: z.string().optional().nullable(),
  ipAddress: z.string().optional().nullable(),
  publicIpAddress: z.string().optional().nullable(),
  status: z.nativeEnum(VmStatus),
  renewalDate: z.string().optional().nullable(),
  decommissionedAt: z.string().optional().nullable(),
  hasRemoteAccess: z.boolean(),
  vpnRequired: z.boolean(),
});

const vmSpecSchema = z.object({
  vcpu: z.number().int().min(1),
  ramGb: z.number().int().min(1),
  storageGb: z.number().int().min(1),
  osName: z.string().optional().nullable(),
  osVersion: z.string().optional().nullable(),
  raid: z
    .enum(["RAID0", "RAID1", "RAID5", "RAID10", "NONE"])
    .optional()
    .nullable(),
});

// ==============
// Actions
// ==============

// 1. CREATE VM + INITIAL SPEC + AUDIT
export async function createVm(formData: FormData, actorId: string) {
  const vmData = vmBaseSchema.parse(Object.fromEntries(formData));
  const specData = vmSpecSchema.parse(Object.fromEntries(formData));

  const vm = await prisma.$transaction(async (tx) => {
    const vm = await tx.vmInstance.create({
      data: {
        ...vmData,
        renewalDate: vmData.renewalDate ? new Date(vmData.renewalDate) : null,
        decommissionedAt: vmData.decommissionedAt
          ? new Date(vmData.decommissionedAt)
          : null,
      },
    });

    await tx.vmSpec.create({
      data: {
        ...specData,
        vmInstanceId: vm.id,
        effectiveFrom: new Date(),
      },
    });

    return vm;
  });

  await createAuditLog(
    actorId,
    "VM_CREATED",
    "VmInstance",
    vm.id,
    vmData,
    vm.id
  );
  revalidatePath("/inventory/vms");
  return vm;
}

// 2. UPDATE VM METADATA + AUDIT
export async function updateVm(formData: FormData, actorId: string) {
  const validated = vmBaseSchema
    .extend({ id: z.string().uuid() })
    .parse(Object.fromEntries(formData));

  const { id, ...data } = validated;
  const oldVm = await prisma.vmInstance.findUnique({ where: { id } });

  const updatedVm = await prisma.vmInstance.update({
    where: { id },
    data: {
      ...data,
      renewalDate: data.renewalDate ? new Date(data.renewalDate) : null,
      decommissionedAt: data.decommissionedAt
        ? new Date(data.decommissionedAt)
        : null,
    },
  });

  await createAuditLog(
    actorId,
    "VM_UPDATED",
    "VmInstance",
    id,
    { old: oldVm, new: data },
    id
  );
  revalidatePath("/inventory/vms");
}

// 3. UPDATE RESOURCES VIA CUSTOMIZATION REQUEST OR DIRECT
export async function updateVmResources(
  formData: FormData,
  actorId: string,
  viaCustomization: boolean = false
) {
  const vmId = formData.get("vmId") as string;
  if (!vmId) throw new Error("VM ID is required");

  const specData = vmSpecSchema.parse(Object.fromEntries(formData));
  const sourceRequestId = formData.get("sourceRequestId") as string | null;

  await prisma.$transaction(async (tx) => {
    const newSpec = await tx.vmSpec.create({
      data: {
        ...specData,
        vmInstanceId: vmId,
        sourceRequestId: sourceRequestId || undefined,
        effectiveFrom: new Date(),
      },
    });

    await tx.vmInstance.update({
      where: { id: vmId },
      data: { currentSpecId: newSpec.id },
    });
  });

  const action = viaCustomization
    ? "VM_RESOURCES_UPDATED_VIA_CUSTOMIZATION"
    : "VM_RESOURCES_UPDATED";
  await createAuditLog(actorId, action, "VmSpec", vmId, specData, vmId);
  revalidatePath("/inventory/vms");
}

// 4. DECOMMISSION WORKFLOW
export async function decommissionVm(
  vmId: string,
  actorId: string,
  reason?: string
) {
  await prisma.$transaction(async (tx) => {
    // Update VM status and timestamp
    await tx.vmInstance.update({
      where: { id: vmId },
      data: {
        status: "RETIRED",
        decommissionedAt: new Date(),
      },
    });

    // Optionally close related customization requests
    await tx.customizationRequest.updateMany({
      where: {
        targetVmId: vmId,
        status: { in: ["PENDING_L1", "PENDING_L2", "PENDING_L3"] },
      },
      data: { status: "CLOSED" },
    });
  });

  await createAuditLog(
    actorId,
    "VM_DECOMMISSIONED",
    "VmInstance",
    vmId,
    { reason },
    vmId
  );
  revalidatePath("/inventory/vms");
}

// 5. CREATE CUSTOMIZATION REQUEST (linked to VM)
export async function createCustomizationRequest(
  formData: FormData,
  requesterId: string
) {
  const schema = z.object({
    targetVmId: z.string().uuid(),
    vcpu: z.number().int().optional(),
    ramGb: z.number().int().optional(),
    storageGb: z.number().int().optional(),
    // Optional structured inputs can be added later
  });

  const data = schema.parse(Object.fromEntries(formData));

  // Ensure at least one resource is requested
  if (!data.vcpu && !data.ramGb && !data.storageGb) {
    throw new Error("At least one resource change must be specified");
  }

  const customization = await prisma.customizationRequest.create({
    data: {
      ...data,
      requesterId,
      status: "PENDING_L1",
    },
  });

  await createAuditLog(
    requesterId,
    "CUSTOMIZATION_REQUESTED",
    "CustomizationRequest",
    customization.id,
    data,
    data.targetVmId
  );

  revalidatePath(`/vms/${data.targetVmId}`);
  revalidatePath("/requests/customizations");
}

// 6. FETCH SINGLE VM WITH FULL CONTEXT
export async function fetchVmDetails(id: string) {
  return await prisma.vmInstance.findUnique({
    where: { id },
    include: {
      currentSpec: true,
      owner: { select: { name: true, email: true } },
      request: {
        select: {
          systemName: true,
          environment: true,
          requestId: true,
          purpose: true,
          requester: { select: { name: true, email: true } },
        },
      },
      customizationRequests: {
        where: { status: { not: "CLOSED" } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

// 7. FETCH VM LIST FOR DASHBOARD
export async function fetchAllVms({
  page = 1,
  perPage = 10,
  search,
  statusFilter,
}: {
  page?: number;
  perPage?: number;
  search?: string;
  statusFilter?: VmStatus | "all";
}) {
  const skip = (page - 1) * perPage;

  const where: any = {};

  // Status filter
  if (statusFilter && statusFilter !== "all") {
    where.status = statusFilter;
  }

  // Search
  if (search) {
    where.OR = [
      { hostname: { contains: search, mode: Prisma.QueryMode.insensitive } },
      { ipAddress: { contains: search, mode: Prisma.QueryMode.insensitive } },
      {
        request: {
          systemName: { contains: search, mode: Prisma.QueryMode.insensitive },
        },
      },
    ];
  }

  const [vms, total] = await Promise.all([
    prisma.vmInstance.findMany({
      where,
      skip,
      take: perPage,
      orderBy: { createdAt: "desc" },
      include: {
        currentSpec: true,
        owner: { select: { name: true } },
        request: { select: { systemName: true, environment: true } },
      },
    }),
    prisma.vmInstance.count({ where }),
  ]);

  return { vms, total, totalPages: Math.ceil(total / perPage) };
}

export async function fetchVmAuditLogs(vmId: string) {
  return prisma.auditLog.findMany({
    where: { vmId },
    orderBy: { timestamp: "desc" },
    take: 20,
  });
}
