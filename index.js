import { Bot } from "grammy";

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error("TELEGRAM_BOT_TOKEN manquant dans .env");
  process.exit(1);
}

const bot = new Bot(token);

bot.command("start", (ctx) => {
  ctx.reply("👋 Bienvenue ! Bot Telegram minimal prêt à l'emploi.");
});

bot.command("help", (ctx) => {
  ctx.reply("Commandes disponibles:\n/start - accueil\n/help - aide\n\nEnvoie un texte et je réponds.");
});

bot.on("message:text", (ctx) => {
  const text = ctx.message.text.trim();

  if (!text) {
    ctx.reply("Envoie un message texte simple 🙂");
    return;
  }

  ctx.reply(`Tu as dit: ${text}`);
});

bot.catch((err) => {
  console.error("Erreur bot:", err.error);
});

bot.start();
console.log("Bot lancé.");
