import { z } from "zod";

export const telegramTextSchema = z
  .string()
  .trim()
  .min(1)
  .max(1000)
  .transform((v) => v.replace(/[<>]/g, ""));

export const callbackPayloadSchema = z
  .string()
  .regex(/^[a-z_]+(?::[a-zA-Z0-9_-]+){0,3}$/);
