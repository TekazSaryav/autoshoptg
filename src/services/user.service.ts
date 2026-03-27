import { UserRole } from "@prisma/client";
import type { UserFromGetMe } from "grammy/types";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";

export const userService = {
  async ensureUser(telegramUser: UserFromGetMe) {
    const telegramId = BigInt(telegramUser.id);
    let role: UserRole = UserRole.CLIENT;

    if (env.adminTelegramIds.has(telegramId)) role = UserRole.ADMIN;
    else if (env.staffTelegramIds.has(telegramId)) role = UserRole.STAFF;

    return prisma.user.upsert({
      where: { telegramId },
      update: {
        username: telegramUser.username,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        role
      },
      create: {
        telegramId,
        username: telegramUser.username,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        role
      }
    });
  }
};
