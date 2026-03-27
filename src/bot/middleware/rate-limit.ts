import type { NextFunction } from "grammy";
import type { BotContext } from "../context.js";
import { env } from "../../config/env.js";
import { redis } from "../../lib/redis.js";

export const rateLimitMiddleware = async (ctx: BotContext, next: NextFunction) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  const key = `rl:${userId}:${new Date().toISOString().slice(0, 16)}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, 60);
  }

  if (count > env.RATE_LIMIT_PER_MINUTE) {
    await ctx.reply("Trop de requêtes. Merci de patienter une minute.");
    return;
  }

  await next();
};
