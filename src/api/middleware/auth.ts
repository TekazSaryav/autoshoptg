import type { Request, Response, NextFunction } from "express";
import { env } from "../../config/env.js";

export const internalApiAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header("x-api-key");
  if (token !== env.INTERNAL_API_KEY) {
    return res.status(401).json({ error: "unauthorized" });
  }
  next();
};
