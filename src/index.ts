import { Bot } from "grammy";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { redis } from "./lib/redis.js";
import { prisma } from "./lib/prisma.js";
import type { BotContext } from "./bot/context.js";
import { sessionMiddleware } from "./bot/middleware/session.js";
import { userMiddleware } from "./bot/middleware/user.js";
import { rateLimitMiddleware } from "./bot/middleware/rate-limit.js";
import { registerPublicHandlers } from "./bot/handlers/public.js";
import { registerAdminHandlers } from "./bot/handlers/admin.js";
import { createApiApp } from "./api/app.js";

const bootstrap = async () => {
  const bot = new Bot<BotContext>(env.BOT_TOKEN);

  bot.use(sessionMiddleware);
  bot.use(userMiddleware);
  bot.use(rateLimitMiddleware);

  registerPublicHandlers(bot);
  registerAdminHandlers(bot);

  bot.catch((err) => {
    logger.error({ err }, "Bot error");
  });

  const app = createApiApp();
  app.listen(env.PORT, () => logger.info({ port: env.PORT }, "API server ready"));

  await bot.start();
  logger.info("Bot started");
};

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  redis.disconnect();
  process.exit(0);
});

bootstrap().catch((err) => {
  logger.fatal({ err }, "Startup failed");
  process.exit(1);
});
