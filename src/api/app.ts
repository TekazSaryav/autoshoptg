import express from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { logger } from "../lib/logger.js";
import { healthRouter } from "./routes/health.js";
import { adminRouter } from "./routes/admin.js";
import { internalApiAuth } from "./middleware/auth.js";

export const createApiApp = () => {
  const app = express();
  app.use(helmet());
  app.use(express.json({ limit: "100kb" }));
  app.use(pinoHttp({ logger }));

  app.use(healthRouter);
  app.use("/api/admin", internalApiAuth, adminRouter);

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error({ err }, "Unhandled API error");
    res.status(400).json({ error: "invalid_request" });
  });

  return app;
};
