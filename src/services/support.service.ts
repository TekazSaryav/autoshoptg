import { TicketStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export const supportService = {
  createTicket(userId: string, subject: string, message: string) {
    return prisma.supportTicket.create({
      data: { userId, subject, message, status: TicketStatus.OPEN }
    });
  },

  listTicketsForUser(userId: string) {
    return prisma.supportTicket.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 10 });
  }
};
