import { InlineKeyboard } from "grammy";
import type { Bot } from "grammy";
import type { BotContext } from "../context.js";
import { mainMenuKeyboard } from "../keyboards/main-menu.js";
import { catalogService } from "../../services/catalog.service.js";
import { cartService } from "../../services/cart.service.js";
import { orderService } from "../../services/order.service.js";
import { supportService } from "../../services/support.service.js";
import { env } from "../../config/env.js";
import { telegramTextSchema } from "../../validators/common.js";

const formatPrice = (cents: number, currency = "EUR") => `${(cents / 100).toFixed(2)} ${currency}`;

export const registerPublicHandlers = (bot: Bot<BotContext>) => {
  bot.command("start", async (ctx) => {
    await ctx.reply(
      "Bienvenue sur Nova Boutique ✨\nParcourez le catalogue, gérez votre panier et suivez vos commandes simplement.",
      { reply_markup: mainMenuKeyboard() }
    );
  });

  bot.callbackQuery("menu:shop", async (ctx) => {
    const categories = await catalogService.listCategories();
    const kb = new InlineKeyboard();
    for (const category of categories) kb.text(category.name, `cat:${category.id}`).row();
    kb.text("⬅️ Retour menu", "menu:home");
    await ctx.editMessageText("Choisissez une catégorie :", { reply_markup: kb });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery(/^cat:(.+)$/, async (ctx) => {
    const categoryId = ctx.match[1];
    const products = await catalogService.listProductsByCategory(categoryId);
    const kb = new InlineKeyboard();
    for (const product of products.slice(0, 20)) kb.text(`${product.title} (${formatPrice(product.priceCents)})`, `prd:${product.id}`).row();
    kb.text("⬅️ Catégories", "menu:shop");
    await ctx.editMessageText("Produits disponibles :", { reply_markup: kb });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery(/^prd:(.+)$/, async (ctx) => {
    const product = await catalogService.getProduct(ctx.match[1]);
    if (!product) {
      await ctx.answerCallbackQuery({ text: "Produit indisponible", show_alert: true });
      return;
    }

    const text = [
      `*${product.title}*`,
      product.description,
      `Prix: ${formatPrice(product.priceCents, product.currency)}`,
      `Stock: ${product.stock}`
    ].join("\n");

    const kb = new InlineKeyboard()
      .text("➕ Ajouter au panier", `add:${product.id}`)
      .row()
      .text("⬅️ Retour", `cat:${product.categoryId}`);

    if (product.images[0]?.url) {
      await ctx.replyWithPhoto(product.images[0].url, { caption: text, parse_mode: "Markdown", reply_markup: kb });
    } else {
      await ctx.reply(text, { parse_mode: "Markdown", reply_markup: kb });
    }

    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery(/^add:(.+)$/, async (ctx) => {
    if (!ctx.dbUser) return;
    try {
      await cartService.addItem(ctx.dbUser.id, ctx.match[1], 1);
      await ctx.answerCallbackQuery({ text: "Ajouté au panier" });
    } catch {
      await ctx.answerCallbackQuery({ text: "Produit indisponible", show_alert: true });
    }
  });

  bot.callbackQuery("menu:cart", async (ctx) => {
    if (!ctx.dbUser) return;
    const cart = await cartService.getOrCreateCart(ctx.dbUser.id);
    const total = cart.items.reduce((acc, item) => acc + item.unitPriceCts * item.quantity, 0);
    const lines = cart.items.length
      ? cart.items.map((item) => `• ${item.product.title} x${item.quantity} = ${formatPrice(item.unitPriceCts * item.quantity)}`)
      : ["Votre panier est vide."];

    const kb = new InlineKeyboard();
    for (const item of cart.items) {
      kb.text(`➖ ${item.product.title}`, `dec:${item.id}`).text(`➕`, `inc:${item.id}`).row();
    }
    kb.text("✅ Passer commande", "cart:checkout").row().text("🗑️ Vider", "cart:clear").text("⬅️ Menu", "menu:home");

    await ctx.editMessageText(`*Panier*\n${lines.join("\n")}\n\nTotal: ${formatPrice(total)}`, {
      parse_mode: "Markdown",
      reply_markup: kb
    });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery(/^dec:(.+)$/, async (ctx) => {
    if (!ctx.dbUser) return;
    const itemId = ctx.match[1];
    const cart = await cartService.getOrCreateCart(ctx.dbUser.id);
    const item = cart.items.find((it) => it.id === itemId);
    if (item) await cartService.updateItem(ctx.dbUser.id, itemId, item.quantity - 1);
    await ctx.answerCallbackQuery({ text: "Panier mis à jour" });
  });

  bot.callbackQuery(/^inc:(.+)$/, async (ctx) => {
    if (!ctx.dbUser) return;
    const itemId = ctx.match[1];
    const cart = await cartService.getOrCreateCart(ctx.dbUser.id);
    const item = cart.items.find((it) => it.id === itemId);
    if (item) await cartService.updateItem(ctx.dbUser.id, itemId, item.quantity + 1);
    await ctx.answerCallbackQuery({ text: "Panier mis à jour" });
  });

  bot.callbackQuery("cart:clear", async (ctx) => {
    if (!ctx.dbUser) return;
    await cartService.clear(ctx.dbUser.id);
    await ctx.answerCallbackQuery({ text: "Panier vidé" });
  });

  bot.callbackQuery("cart:checkout", async (ctx) => {
    if (!ctx.dbUser) return;
    try {
      const order = await orderService.checkout(ctx.dbUser.id);
      await ctx.reply(
        `Commande ${order.orderNumber} créée.\nStatut: ${order.status}\nMontant: ${formatPrice(order.totalCents)}\n\nPaiement manuel:\n${env.MANUAL_PAYMENT_INSTRUCTIONS}\n\nUn membre du staff validera le paiement après preuve réelle.`
      );
      await ctx.answerCallbackQuery({ text: "Commande créée" });
    } catch {
      await ctx.answerCallbackQuery({ text: "Impossible de valider le panier", show_alert: true });
    }
  });

  bot.callbackQuery("menu:orders", async (ctx) => {
    if (!ctx.dbUser) return;
    const orders = await orderService.listUserOrders(ctx.dbUser.id);
    if (!orders.length) {
      await ctx.editMessageText("Aucune commande pour le moment.", {
        reply_markup: new InlineKeyboard().text("⬅️ Menu", "menu:home")
      });
      await ctx.answerCallbackQuery();
      return;
    }
    const text = orders
      .map((o) => `${o.orderNumber} · ${o.status} · ${formatPrice(o.totalCents)} · ${o.createdAt.toLocaleDateString("fr-FR")}`)
      .join("\n");
    await ctx.editMessageText(`*Historique des commandes*\n${text}`, {
      parse_mode: "Markdown",
      reply_markup: new InlineKeyboard().text("⬅️ Menu", "menu:home")
    });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("menu:support", async (ctx) => {
    const text = "Support client\nEnvoyez /ticket Sujet | Votre message";
    await ctx.editMessageText(text, {
      reply_markup: new InlineKeyboard().text("Mes tickets", "support:list").row().text("⬅️ Menu", "menu:home")
    });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("support:list", async (ctx) => {
    if (!ctx.dbUser) return;
    const tickets = await supportService.listTicketsForUser(ctx.dbUser.id);
    const text = tickets.length
      ? tickets.map((t) => `#${t.id.slice(-6)} · ${t.subject} · ${t.status}`).join("\n")
      : "Aucun ticket.";
    await ctx.reply(text);
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("menu:help", async (ctx) => {
    await ctx.editMessageText(
      "FAQ\n• Délais de traitement: 24-48h\n• Paiement: manuel vérifié\n• Annulation: possible avant expédition",
      { reply_markup: new InlineKeyboard().text("⬅️ Menu", "menu:home") }
    );
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("menu:home", async (ctx) => {
    await ctx.editMessageText("Menu principal", { reply_markup: mainMenuKeyboard() });
    await ctx.answerCallbackQuery();
  });

  bot.command("ticket", async (ctx) => {
    if (!ctx.dbUser || !ctx.message?.text) return;
    const raw = ctx.message.text.replace(/^\/ticket\s*/i, "");
    const [subjectRaw, ...rest] = raw.split("|");
    const subject = telegramTextSchema.safeParse(subjectRaw ?? "");
    const message = telegramTextSchema.safeParse(rest.join("|") ?? "");
    if (!subject.success || !message.success) {
      await ctx.reply("Format invalide. Exemple: /ticket Livraison | Où en est ma commande ?");
      return;
    }
    await supportService.createTicket(ctx.dbUser.id, subject.data, message.data);
    await ctx.reply("Ticket créé. Notre équipe vous répondra rapidement.");
  });
};
