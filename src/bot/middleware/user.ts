import type { NextFunction } from "grammy";
import type { BotContext } from "../context.js";
import { userService } from "../../services/user.service.js";

export const userMiddleware = async (ctx: BotContext, next: NextFunction) => {
  if (ctx.from) {
    ctx.dbUser = await userService.ensureUser(ctx.from);
  }
  await next();
};
