"""
Patek Shop - Telegram Bot with Mini App
"""
import os
import asyncio
from datetime import datetime, timezone
from dotenv import load_dotenv
load_dotenv()

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import (
    Application, CommandHandler, CallbackQueryHandler, MessageHandler,
    ContextTypes, filters
)
from telegram.constants import ParseMode
import structlog

from database import (
    UserService, CategoryService, ProductService, CartService,
    OrderService, PaymentService, SupportService, AdminLogService, init_indexes
)

logger = structlog.get_logger()

# Config
BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
ADMIN_IDS = set(int(x.strip()) for x in os.environ.get("ADMIN_TELEGRAM_IDS", "").split(",") if x.strip())
STAFF_IDS = set(int(x.strip()) for x in os.environ.get("STAFF_TELEGRAM_IDS", "").split(",") if x.strip())
SHOP_NAME = os.environ.get("SHOP_NAME", "Patek Shop")
BTC_ADDRESS = os.environ.get("BTC_ADDRESS", "")
LTC_ADDRESS = os.environ.get("LTC_ADDRESS", "")
WEBAPP_URL = os.environ.get("WEBAPP_URL", "https://b4cf57de-bdf3-496a-8f16-0311d8a527a2.preview.emergentagent.com")
RATE_LIMIT = int(os.environ.get("RATE_LIMIT_PER_MINUTE", "30"))

# Rate limiter
user_requests = {}

def is_rate_limited(user_id: int) -> bool:
    now = datetime.now(timezone.utc).timestamp()
    if user_id not in user_requests:
        user_requests[user_id] = []
    user_requests[user_id] = [t for t in user_requests[user_id] if now - t < 60]
    if len(user_requests[user_id]) >= RATE_LIMIT:
        return True
    user_requests[user_id].append(now)
    return False

def is_admin(telegram_id: int) -> bool:
    return telegram_id in ADMIN_IDS

def is_staff(telegram_id: int) -> bool:
    return telegram_id in ADMIN_IDS or telegram_id in STAFF_IDS

def format_price(cents: int, currency: str = "EUR") -> str:
    return f"{cents / 100:.2f} {currency}"

def get_user(update: Update) -> dict:
    tg_user = update.effective_user
    return UserService.get_or_create(
        telegram_id=tg_user.id,
        first_name=tg_user.first_name or "User",
        last_name=tg_user.last_name,
        username=tg_user.username
    )

# Main keyboard with WebApp button
def main_menu_keyboard() -> InlineKeyboardMarkup:
    keyboard = [
        [InlineKeyboardButton("🛍️ Ouvrir la boutique", web_app=WebAppInfo(url=WEBAPP_URL))],
    ]
    return InlineKeyboardMarkup(keyboard)

def admin_menu_keyboard() -> InlineKeyboardMarkup:
    keyboard = [
        [InlineKeyboardButton("📊 Stats", callback_data="admin:stats"),
         InlineKeyboardButton("📦 Commandes", callback_data="admin:orders")],
        [InlineKeyboardButton("🎫 Tickets", callback_data="admin:tickets"),
         InlineKeyboardButton("👥 Users", callback_data="admin:users")],
        [InlineKeyboardButton("💰 Ajouter solde", callback_data="admin:add_balance")],
    ]
    return InlineKeyboardMarkup(keyboard)

# Handlers
async def start_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if is_rate_limited(update.effective_user.id):
        return
    
    user = get_user(update)
    balance = user.get("balance_cents", 0)
    
    welcome_text = f"""✨ *Bienvenue sur {SHOP_NAME}* ✨

Votre solde: *{format_price(balance)}*

Cliquez sur le bouton ci-dessous pour ouvrir notre boutique et parcourir nos produits."""
    
    await update.message.reply_text(
        welcome_text,
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=main_menu_keyboard()
    )

# Admin handlers
async def admin_command_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_staff(update.effective_user.id):
        await update.message.reply_text("Accès refusé.")
        return
    
    await update.message.reply_text(
        "🔐 *Panel Admin*",
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=admin_menu_keyboard()
    )

async def admin_stats_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    
    if not is_staff(update.effective_user.id):
        await query.answer("Accès refusé", show_alert=True)
        return
    
    await query.answer()
    
    stats = {
        "users": UserService.count(),
        "products": ProductService.count(),
        "orders_pending": OrderService.count("pending"),
        "orders_paid": OrderService.count("paid"),
        "orders_total": OrderService.count(),
        "tickets_open": SupportService.count("open")
    }
    
    text = f"""📊 *Statistiques {SHOP_NAME}*

👥 *Utilisateurs :* {stats['users']}
📦 *Produits actifs :* {stats['products']}

*Commandes :*
  ⏳ En attente : {stats['orders_pending']}
  ✅ Payées : {stats['orders_paid']}
  📋 Total : {stats['orders_total']}

🎫 *Tickets ouverts :* {stats['tickets_open']}"""
    
    await query.edit_message_text(
        text,
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=admin_menu_keyboard()
    )

async def admin_orders_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    
    if not is_staff(update.effective_user.id):
        await query.answer("Accès refusé", show_alert=True)
        return
    
    await query.answer()
    
    orders = OrderService.list_all(limit=15)
    
    if not orders:
        await query.edit_message_text("Aucune commande.", reply_markup=admin_menu_keyboard())
        return
    
    status_icons = {"pending": "⏳", "paid": "✅", "preparing": "📦", "shipped": "🚚", "completed": "✔️", "canceled": "❌"}
    
    lines = ["📦 *Commandes récentes*\n"]
    for order in orders:
        icon = status_icons.get(order["status"], "❓")
        lines.append(f"{icon} `{order['order_number']}` — {format_price(order['total_cents'])} — {order['status']}")
    
    lines.append("\n_Utilisez /order\\_status <id> <status> pour modifier_")
    
    await query.edit_message_text(
        "\n".join(lines),
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=admin_menu_keyboard()
    )

async def admin_tickets_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    
    if not is_staff(update.effective_user.id):
        await query.answer("Accès refusé", show_alert=True)
        return
    
    await query.answer()
    
    tickets = SupportService.list_all(limit=15)
    
    if not tickets:
        await query.edit_message_text("Aucun ticket.", reply_markup=admin_menu_keyboard())
        return
    
    status_icons = {"open": "🟢", "in_progress": "🟡", "resolved": "✅", "closed": "⚫"}
    
    lines = ["🎫 *Tickets récents*\n"]
    for ticket in tickets:
        icon = status_icons.get(ticket["status"], "❓")
        lines.append(f"{icon} *{ticket['subject']}* — {ticket['status']}")
    
    await query.edit_message_text(
        "\n".join(lines),
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=admin_menu_keyboard()
    )

async def admin_users_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    
    if not is_staff(update.effective_user.id):
        await query.answer("Accès refusé", show_alert=True)
        return
    
    await query.answer()
    
    users = UserService.list_all(limit=20)
    
    lines = ["👥 *Utilisateurs récents*\n"]
    for user in users:
        role_icon = "👑" if user["role"] == "admin" else "🛡️" if user["role"] == "staff" else "👤"
        balance = user.get("balance_cents", 0)
        lines.append(f"{role_icon} {user['first_name']} — {format_price(balance)} — ID: `{user['telegram_id']}`")
    
    lines.append("\n_Utilisez /add\\_balance <telegram\\_id> <montant\\_cents>_")
    
    await query.edit_message_text(
        "\n".join(lines),
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=admin_menu_keyboard()
    )

async def admin_add_balance_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    
    if not is_staff(update.effective_user.id):
        await query.answer("Accès refusé", show_alert=True)
        return
    
    await query.answer()
    
    text = """💰 *Ajouter du solde*

Pour créditer un utilisateur, utilisez:
`/add_balance <telegram_id> <montant_centimes>`

*Exemple :*
`/add_balance 123456789 1000` (ajoute 10.00€)"""
    
    await query.edit_message_text(
        text,
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=admin_menu_keyboard()
    )

# Admin command handlers
async def add_balance_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_staff(update.effective_user.id):
        await update.message.reply_text("Accès refusé.")
        return
    
    args = context.args
    if len(args) < 2:
        await update.message.reply_text("Usage: /add_balance <telegram_id> <montant_centimes>")
        return
    
    try:
        telegram_id = int(args[0])
        amount_cents = int(args[1])
    except ValueError:
        await update.message.reply_text("Arguments invalides.")
        return
    
    user = UserService.get_by_telegram_id(telegram_id)
    if not user:
        await update.message.reply_text("Utilisateur introuvable.")
        return
    
    updated = UserService.add_balance(user["id"], amount_cents)
    
    admin_user = get_user(update)
    AdminLogService.log(admin_user["id"], update.effective_user.id, "balance.add", "user", user["id"], {"amount": amount_cents})
    
    await update.message.reply_text(
        f"✅ Solde ajouté !\n\nUtilisateur: {user['first_name']}\nMontant ajouté: {format_price(amount_cents)}\nNouveau solde: {format_price(updated.get('balance_cents', 0))}",
        parse_mode=ParseMode.MARKDOWN
    )
    
    # Notify user
    try:
        await context.bot.send_message(
            chat_id=telegram_id,
            text=f"💰 *Votre compte a été crédité !*\n\nMontant: +{format_price(amount_cents)}\nNouveau solde: {format_price(updated.get('balance_cents', 0))}",
            parse_mode=ParseMode.MARKDOWN
        )
    except Exception:
        pass

async def order_status_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_staff(update.effective_user.id):
        await update.message.reply_text("Accès refusé.")
        return
    
    args = context.args
    if len(args) < 2:
        await update.message.reply_text("Usage: /order_status <order_number> <pending|paid|preparing|shipped|completed|canceled>")
        return
    
    order_ref = args[0]
    new_status = args[1].lower()
    
    valid_statuses = ["pending", "paid", "preparing", "shipped", "completed", "canceled"]
    if new_status not in valid_statuses:
        await update.message.reply_text(f"Statut invalide. Choisissez parmi : {', '.join(valid_statuses)}")
        return
    
    order = OrderService.search(order_ref)
    if not order:
        await update.message.reply_text("Commande introuvable.")
        return
    
    old_status = order["status"]
    updated = OrderService.update_status(order["id"], new_status)
    
    admin_user = get_user(update)
    AdminLogService.log(admin_user["id"], update.effective_user.id, "order.status.update", "order", order["id"], {"old": old_status, "new": new_status})
    
    await update.message.reply_text(f"✅ Commande `{updated['order_number']}` : {old_status} → {new_status}", parse_mode=ParseMode.MARKDOWN)
    
    # Notify customer
    try:
        status_labels = {
            "pending": "⏳ En attente",
            "paid": "✅ Payée",
            "preparing": "📦 En préparation",
            "shipped": "🚚 Expédiée",
            "completed": "✔️ Terminée",
            "canceled": "❌ Annulée"
        }
        await context.bot.send_message(
            chat_id=order["user_telegram_id"],
            text=f"📦 *Mise à jour de votre commande*\n\nCommande: `{order['order_number']}`\nNouveau statut: {status_labels.get(new_status, new_status)}",
            parse_mode=ParseMode.MARKDOWN
        )
    except Exception:
        pass

async def broadcast_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_admin(update.effective_user.id):
        await update.message.reply_text("Accès refusé.")
        return
    
    text = update.message.text.replace("/broadcast", "").strip()
    if len(text) < 5:
        await update.message.reply_text("Message trop court. Usage: /broadcast Votre message")
        return
    
    users = UserService.list_active()
    sent = 0
    failed = 0
    
    for user in users[:500]:
        try:
            await context.bot.send_message(chat_id=user["telegram_id"], text=text)
            sent += 1
            await asyncio.sleep(0.05)
        except Exception:
            failed += 1
    
    admin_user = get_user(update)
    AdminLogService.log(admin_user["id"], update.effective_user.id, "broadcast.send", "user", None, {"sent": sent, "failed": failed})
    
    await update.message.reply_text(f"✅ Broadcast envoyé : {sent} succès, {failed} échecs")

async def order_find_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_staff(update.effective_user.id):
        await update.message.reply_text("Accès refusé.")
        return
    
    args = context.args
    if not args:
        await update.message.reply_text("Usage: /order_find <order_number>")
        return
    
    order = OrderService.search(args[0])
    if not order:
        await update.message.reply_text("Commande introuvable.")
        return
    
    user = UserService.get_by_id(order["user_id"])
    items_text = "\n".join([f"  • {item['title']} x{item['quantity']} = {format_price(item['total_price_cents'])}" for item in order.get("items", [])])
    
    text = f"""📋 *Commande {order['order_number']}*

👤 *Client :* {user['first_name'] if user else 'N/A'} (ID: {order['user_telegram_id']})
📊 *Statut :* {order['status']}
💰 *Total :* {format_price(order['total_cents'])}

📦 *Articles :*
{items_text}"""
    
    await update.message.reply_text(text, parse_mode=ParseMode.MARKDOWN)

def main():
    init_indexes()
    
    application = Application.builder().token(BOT_TOKEN).build()
    
    # Public commands
    application.add_handler(CommandHandler("start", start_handler))
    
    # Admin commands
    application.add_handler(CommandHandler("admin", admin_command_handler))
    application.add_handler(CommandHandler("add_balance", add_balance_command))
    application.add_handler(CommandHandler("order_status", order_status_command))
    application.add_handler(CommandHandler("order_find", order_find_command))
    application.add_handler(CommandHandler("broadcast", broadcast_command))
    
    # Admin callbacks
    application.add_handler(CallbackQueryHandler(admin_stats_handler, pattern="^admin:stats$"))
    application.add_handler(CallbackQueryHandler(admin_orders_handler, pattern="^admin:orders$"))
    application.add_handler(CallbackQueryHandler(admin_tickets_handler, pattern="^admin:tickets$"))
    application.add_handler(CallbackQueryHandler(admin_users_handler, pattern="^admin:users$"))
    application.add_handler(CallbackQueryHandler(admin_add_balance_handler, pattern="^admin:add_balance$"))
    
    logger.info("Bot starting", shop=SHOP_NAME, webapp_url=WEBAPP_URL)
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    main()
