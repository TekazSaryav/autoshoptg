import type { NextFunction } from "grammy";
import type { BotContext, BotSession } from "../context.js";
import { redis } from "../../lib/redis.js";

const keyFor = (userId: number) => `session:${userId}`;

export const sessionMiddleware = async (ctx: BotContext, next: NextFunction) => {
  const userId = ctx.from?.id;
  if (!userId) return next();

  const raw = await redis.get(keyFor(userId));
  ctx.session = raw ? (JSON.parse(raw) as BotSession) : {};

  await next();

  await redis.set(keyFor(userId), JSON.stringify(ctx.session), "EX", 60 * 60 * 24 * 7);
};
