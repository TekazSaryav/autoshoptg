import type { User } from "@prisma/client";
import type { Context } from "grammy";

export interface BotSession {
  supportDraft?: { subject: string };
}

export type BotContext = Context & {
  session: BotSession;
  dbUser?: User;
};
