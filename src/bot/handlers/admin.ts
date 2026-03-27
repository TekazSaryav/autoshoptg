import { OrderStatus, UserRole } from "@prisma/client";
import type { Bot } from "grammy";
import type { BotContext } from "../context.js";
import { orderService } from "../../services/order.service.js";
import { adminLogService } from "../../services/admin-log.service.js";
import { prisma } from "../../lib/prisma.js";

const parseStatus = (v: string) => {
  const status = v.toUpperCase() as OrderStatus;
  if (!Object.values(OrderStatus).includes(status)) throw new Error("INVALID_STATUS");
  return status;
};

export const registerAdminHandlers = (bot: Bot<BotContext>) => {
  const requireStaff = (ctx: BotContext) =>
    ctx.dbUser && [UserRole.ADMIN, UserRole.STAFF].includes(ctx.dbUser.role);

  bot.command("admin_orders", async (ctx) => {
    if (!requireStaff(ctx)) return ctx.reply("Accès refusé.");
    const orders = await orderService.listAdminOrders();
    const lines = orders
      .slice(0, 15)
      .map((o) => `${o.id} | ${o.orderNumber} | ${o.status} | ${o.user.firstName}`)
      .join("\n");
    await ctx.reply(lines || "Aucune commande.");
  });

  bot.command("order_status", async (ctx) => {
    if (!requireStaff(ctx) || !ctx.message?.text) return;
    const [, orderId, statusRaw] = ctx.message.text.split(" ");
    if (!orderId || !statusRaw) return ctx.reply("Usage: /order_status <orderId> <pending|paid|preparing|shipped|completed|canceled>");

    const status = parseStatus(statusRaw);
    const updated = await orderService.updateStatus(orderId, status);
    await adminLogService.log(ctx.dbUser!.id, "order.status.update", "order", orderId, { status });
    await ctx.reply(`Commande ${updated.orderNumber} -> ${updated.status}`);
  });

  bot.command("order_find", async (ctx) => {
    if (!requireStaff(ctx) || !ctx.message?.text) return;
    const [, ref] = ctx.message.text.split(" ");
    if (!ref) return ctx.reply("Usage: /order_find <orderId|orderNumber>");
    const order = await prisma.order.findFirst({ where: { OR: [{ id: ref }, { orderNumber: ref }] }, include: { items: true, payments: true } });
    if (!order) return ctx.reply("Commande introuvable.");
    await ctx.reply(`${order.orderNumber}\nStatus: ${order.status}\nItems: ${order.items.length}\nTotal: ${(order.totalCents / 100).toFixed(2)} ${order.currency}`);
  });

  bot.command("broadcast", async (ctx) => {
    if (!ctx.dbUser || ctx.dbUser.role !== UserRole.ADMIN || !ctx.message?.text) return;
    const text = ctx.message.text.replace(/^\/broadcast\s*/i, "").trim();
    if (text.length < 5) return ctx.reply("Message trop court.");

    const users = await prisma.user.findMany({ where: { isActive: true }, select: { telegramId: true } });
    let sent = 0;
    for (const user of users.slice(0, 200)) {
      try {
        await ctx.api.sendMessage(user.telegramId.toString(), text);
        sent += 1;
      } catch {
        continue;
      }
    }
    await adminLogService.log(ctx.dbUser.id, "broadcast.send", "user", undefined, { sent });
    await ctx.reply(`Broadcast envoyé à ${sent} utilisateurs.`);
  });
};
