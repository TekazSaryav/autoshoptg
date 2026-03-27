import { InlineKeyboard } from "grammy";

export const mainMenuKeyboard = () =>
  new InlineKeyboard()
    .text("🛍️ Boutique", "menu:shop")
    .text("🧺 Panier", "menu:cart")
    .row()
    .text("📦 Mes commandes", "menu:orders")
    .text("🆘 Support", "menu:support")
    .row()
    .text("❓ FAQ / Aide", "menu:help");
