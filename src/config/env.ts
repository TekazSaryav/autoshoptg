import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  BOT_TOKEN: z.string().min(10),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  ADMIN_TELEGRAM_IDS: z.string().default(""),
  STAFF_TELEGRAM_IDS: z.string().default(""),
  INTERNAL_API_KEY: z.string().min(16),
  MANUAL_PAYMENT_INSTRUCTIONS: z.string().default("Virement SEPA. Référence: votre numéro de commande."),
  RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(20)
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(`Invalid environment variables: ${parsed.error.message}`);
}

const toIdSet = (value: string): Set<bigint> =>
  new Set(
    value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
      .map((v) => BigInt(v))
  );

export const env = {
  ...parsed.data,
  adminTelegramIds: toIdSet(parsed.data.ADMIN_TELEGRAM_IDS),
  staffTelegramIds: toIdSet(parsed.data.STAFF_TELEGRAM_IDS)
};
