import { prisma } from "../lib/prisma.js";

export const adminLogService = {
  log(actorId: string, action: string, targetType: string, targetId?: string, metadata?: unknown) {
    return prisma.adminLog.create({
      data: { actorId, action, targetType, targetId, metadata: (metadata ?? undefined) as object | undefined }
    });
  }
};
