"""
Patek Shop - Telegram Bot
"""
import os
import asyncio
from datetime import datetime, timezone
from dotenv import load_dotenv
load_dotenv()

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, InputMediaPhoto
from telegram.ext import (
    Application, CommandHandler, CallbackQueryHandler, MessageHandler,
    ContextTypes, filters, ConversationHandler
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

# Keyboards
def main_menu_keyboard() -> InlineKeyboardMarkup:
    keyboard = [
        [InlineKeyboardButton("🛍️ Boutique", callback_data="menu:shop"),
         InlineKeyboardButton("🧺 Panier", callback_data="menu:cart")],
        [InlineKeyboardButton("📦 Mes commandes", callback_data="menu:orders"),
         InlineKeyboardButton("💬 Support", callback_data="menu:support")],
        [InlineKeyboardButton("❓ FAQ / Aide", callback_data="menu:help")]
    ]
    return InlineKeyboardMarkup(keyboard)

def admin_menu_keyboard() -> InlineKeyboardMarkup:
    keyboard = [
        [InlineKeyboardButton("📊 Stats", callback_data="admin:stats"),
         InlineKeyboardButton("📦 Commandes", callback_data="admin:orders")],
        [InlineKeyboardButton("🎫 Tickets", callback_data="admin:tickets"),
         InlineKeyboardButton("👥 Users", callback_data="admin:users")],
        [InlineKeyboardButton("⬅️ Menu client", callback_data="menu:home")]
    ]
    return InlineKeyboardMarkup(keyboard)

# Handlers
async def start_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if is_rate_limited(update.effective_user.id):
        return
    
    user = get_user(update)
    
    welcome_text = f"""✨ *Bienvenue sur {SHOP_NAME}* ✨

Parcourez notre catalogue, gérez votre panier et suivez vos commandes simplement.

Utilisez le menu ci-dessous pour naviguer."""
    
    await update.message.reply_text(
        welcome_text,
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=main_menu_keyboard()
    )

async def menu_home_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    text = f"*{SHOP_NAME}* — Menu principal"
    await query.edit_message_text(text, parse_mode=ParseMode.MARKDOWN, reply_markup=main_menu_keyboard())

# Shop handlers
async def shop_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    categories = CategoryService.list_active()
    
    if not categories:
        await query.edit_message_text(
            "Aucune catégorie disponible pour le moment.",
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("⬅️ Retour", callback_data="menu:home")]])
        )
        return
    
    keyboard = []
    for cat in categories:
        count = CategoryService.count_products(cat["id"])
        icon = cat.get("icon", "📁")
        keyboard.append([InlineKeyboardButton(f"{icon} {cat['name']} ({count})", callback_data=f"cat:{cat['id']}")])
    
    keyboard.append([InlineKeyboardButton("⬅️ Retour menu", callback_data="menu:home")])
    
    await query.edit_message_text(
        "🏪 *Choisissez une catégorie :*",
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

async def category_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    cat_id = query.data.split(":")[1]
    category = CategoryService.get_by_id(cat_id)
    
    if not category:
        await query.edit_message_text("Catégorie introuvable.")
        return
    
    products = ProductService.list_by_category(cat_id)
    
    if not products:
        await query.edit_message_text(
            f"Aucun produit disponible dans *{category['name']}*.",
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("⬅️ Catégories", callback_data="menu:shop")]])
        )
        return
    
    keyboard = []
    for product in products[:15]:
        price = format_price(product["price_cents"])
        stock_icon = "✅" if product["stock"] > 0 else "❌"
        keyboard.append([InlineKeyboardButton(
            f"{stock_icon} {product['title']} — {price}",
            callback_data=f"prd:{product['id']}"
        )])
    
    keyboard.append([InlineKeyboardButton("⬅️ Catégories", callback_data="menu:shop")])
    
    await query.edit_message_text(
        f"📦 *{category['name']}*\n{category.get('description', '')}",
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

async def product_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    product_id = query.data.split(":")[1]
    product = ProductService.get_by_id(product_id)
    
    if not product:
        await query.answer("Produit introuvable", show_alert=True)
        return
    
    price = format_price(product["price_cents"], product["currency"])
    stock_status = f"✅ En stock ({product['stock']})" if product["stock"] > 0 else "❌ Rupture de stock"
    
    text = f"""*{product['title']}*

{product['description']}

💰 *Prix :* {price}
📦 *Stock :* {stock_status}
🔖 *SKU :* `{product['sku']}`"""
    
    keyboard = []
    if product["stock"] > 0:
        keyboard.append([InlineKeyboardButton("➕ Ajouter au panier", callback_data=f"add:{product_id}")])
    keyboard.append([InlineKeyboardButton("⬅️ Retour", callback_data=f"cat:{product['category_id']}")])
    
    # Send with image if available
    if product.get("images") and len(product["images"]) > 0:
        try:
            await query.message.delete()
            await context.bot.send_photo(
                chat_id=query.message.chat_id,
                photo=product["images"][0]["url"],
                caption=text,
                parse_mode=ParseMode.MARKDOWN,
                reply_markup=InlineKeyboardMarkup(keyboard)
            )
        except Exception:
            await query.edit_message_text(text, parse_mode=ParseMode.MARKDOWN, reply_markup=InlineKeyboardMarkup(keyboard))
    else:
        await query.edit_message_text(text, parse_mode=ParseMode.MARKDOWN, reply_markup=InlineKeyboardMarkup(keyboard))

async def add_to_cart_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    user = get_user(update)
    product_id = query.data.split(":")[1]
    
    try:
        CartService.add_item(user["id"], product_id, 1)
        await query.answer("✅ Ajouté au panier")
    except ValueError as e:
        await query.answer(str(e), show_alert=True)

# Cart handlers
async def cart_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    user = get_user(update)
    cart = CartService.get_or_create(user["id"])
    items = cart.get("items", [])
    
    if not items:
        await query.edit_message_text(
            "🧺 Votre panier est vide.",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("🛍️ Parcourir la boutique", callback_data="menu:shop")],
                [InlineKeyboardButton("⬅️ Menu", callback_data="menu:home")]
            ])
        )
        return
    
    total = sum(item["unit_price_cents"] * item["quantity"] for item in items)
    
    lines = ["🧺 *Votre panier*\n"]
    for item in items:
        subtotal = format_price(item["unit_price_cents"] * item["quantity"])
        lines.append(f"• {item['product_title']} x{item['quantity']} = {subtotal}")
    
    lines.append(f"\n💰 *Total :* {format_price(total)}")
    
    keyboard = []
    for item in items:
        keyboard.append([
            InlineKeyboardButton(f"➖ {item['product_title'][:15]}", callback_data=f"dec:{item['id']}"),
            InlineKeyboardButton("➕", callback_data=f"inc:{item['id']}")
        ])
    
    keyboard.extend([
        [InlineKeyboardButton("✅ Passer commande", callback_data="cart:checkout")],
        [InlineKeyboardButton("🗑️ Vider le panier", callback_data="cart:clear"),
         InlineKeyboardButton("⬅️ Menu", callback_data="menu:home")]
    ])
    
    await query.edit_message_text(
        "\n".join(lines),
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

async def cart_increment_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    user = get_user(update)
    item_id = query.data.split(":")[1]
    
    cart = CartService.get_or_create(user["id"])
    for item in cart.get("items", []):
        if item["id"] == item_id:
            CartService.update_item_quantity(user["id"], item_id, item["quantity"] + 1)
            break
    
    await query.answer("Quantité mise à jour")
    await cart_handler(update, context)

async def cart_decrement_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    user = get_user(update)
    item_id = query.data.split(":")[1]
    
    cart = CartService.get_or_create(user["id"])
    for item in cart.get("items", []):
        if item["id"] == item_id:
            CartService.update_item_quantity(user["id"], item_id, item["quantity"] - 1)
            break
    
    await query.answer("Quantité mise à jour")
    await cart_handler(update, context)

async def cart_clear_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    user = get_user(update)
    CartService.clear(user["id"])
    await query.answer("Panier vidé")
    await cart_handler(update, context)

async def checkout_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    user = get_user(update)
    
    try:
        order = OrderService.create_from_cart(user["id"], update.effective_user.id)
        
        # Create payment
        payment = PaymentService.create(
            order_id=order["id"],
            order_number=order["order_number"],
            method="crypto_btc",
            amount_cents=order["total_cents"],
            crypto_address=BTC_ADDRESS
        )
        
        payment_text = f"""✅ *Commande créée !*

📋 *N° :* `{order['order_number']}`
💰 *Montant :* {format_price(order['total_cents'])}
📊 *Statut :* En attente de paiement

━━━━━━━━━━━━━━━
💳 *Options de paiement :*

*Bitcoin (BTC) :*
`{BTC_ADDRESS}`

*Litecoin (LTC) :*
`{LTC_ADDRESS}`

━━━━━━━━━━━━━━━
⚠️ Après paiement, envoyez une capture ou le hash de transaction au support.
Le paiement sera validé manuellement par notre équipe."""
        
        await query.edit_message_text(
            payment_text,
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("💬 Contacter le support", callback_data="menu:support")],
                [InlineKeyboardButton("📦 Mes commandes", callback_data="menu:orders")],
                [InlineKeyboardButton("⬅️ Menu", callback_data="menu:home")]
            ])
        )
        
    except ValueError as e:
        await query.edit_message_text(
            f"❌ Erreur : {str(e)}",
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("⬅️ Panier", callback_data="menu:cart")]])
        )

# Orders handlers
async def orders_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    user = get_user(update)
    orders = OrderService.list_by_user(user["id"])
    
    if not orders:
        await query.edit_message_text(
            "📦 Vous n'avez aucune commande pour le moment.",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("🛍️ Parcourir la boutique", callback_data="menu:shop")],
                [InlineKeyboardButton("⬅️ Menu", callback_data="menu:home")]
            ])
        )
        return
    
    status_icons = {
        "pending": "⏳",
        "paid": "✅",
        "preparing": "📦",
        "shipped": "🚚",
        "completed": "✔️",
        "canceled": "❌"
    }
    
    lines = ["📦 *Historique des commandes*\n"]
    keyboard = []
    
    for order in orders[:10]:
        icon = status_icons.get(order["status"], "❓")
        date = order["created_at"].strftime("%d/%m/%Y") if hasattr(order["created_at"], "strftime") else str(order["created_at"])[:10]
        lines.append(f"{icon} `{order['order_number']}` — {format_price(order['total_cents'])} — {date}")
        keyboard.append([InlineKeyboardButton(f"📋 {order['order_number']}", callback_data=f"order:{order['id']}")])
    
    keyboard.append([InlineKeyboardButton("⬅️ Menu", callback_data="menu:home")])
    
    await query.edit_message_text(
        "\n".join(lines),
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

async def order_detail_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    order_id = query.data.split(":")[1]
    order = OrderService.get_by_id(order_id)
    
    if not order:
        await query.answer("Commande introuvable", show_alert=True)
        return
    
    status_labels = {
        "pending": "⏳ En attente",
        "paid": "✅ Payée",
        "preparing": "📦 En préparation",
        "shipped": "🚚 Expédiée",
        "completed": "✔️ Terminée",
        "canceled": "❌ Annulée"
    }
    
    items_text = "\n".join([f"  • {item['title']} x{item['quantity']}" for item in order.get("items", [])])
    date = order["created_at"].strftime("%d/%m/%Y %H:%M") if hasattr(order["created_at"], "strftime") else str(order["created_at"])[:16]
    
    text = f"""📋 *Commande {order['order_number']}*

📊 *Statut :* {status_labels.get(order['status'], order['status'])}
📅 *Date :* {date}
💰 *Total :* {format_price(order['total_cents'])}

📦 *Articles :*
{items_text}"""
    
    await query.edit_message_text(
        text,
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("💬 Support", callback_data="menu:support")],
            [InlineKeyboardButton("⬅️ Mes commandes", callback_data="menu:orders")]
        ])
    )

# Support handlers
async def support_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    text = """💬 *Support Client*

Nous sommes là pour vous aider !

Pour créer un nouveau ticket, utilisez la commande :
`/ticket Sujet | Votre message`

*Exemple :*
`/ticket Paiement | J'ai effectué un virement, voici la preuve...`"""
    
    await query.edit_message_text(
        text,
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("📋 Mes tickets", callback_data="support:list")],
            [InlineKeyboardButton("⬅️ Menu", callback_data="menu:home")]
        ])
    )

async def support_list_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    user = get_user(update)
    tickets = SupportService.list_by_user(user["id"])
    
    status_icons = {
        "open": "🟢",
        "in_progress": "🟡",
        "resolved": "✅",
        "closed": "⚫"
    }
    
    if not tickets:
        await query.edit_message_text(
            "Vous n'avez aucun ticket de support.",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("💬 Support", callback_data="menu:support")],
                [InlineKeyboardButton("⬅️ Menu", callback_data="menu:home")]
            ])
        )
        return
    
    lines = ["📋 *Mes tickets*\n"]
    for ticket in tickets[:10]:
        icon = status_icons.get(ticket["status"], "❓")
        lines.append(f"{icon} *{ticket['subject']}* — {ticket['status']}")
    
    await query.edit_message_text(
        "\n".join(lines),
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("💬 Support", callback_data="menu:support")],
            [InlineKeyboardButton("⬅️ Menu", callback_data="menu:home")]
        ])
    )

async def ticket_command_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if is_rate_limited(update.effective_user.id):
        return
    
    user = get_user(update)
    text = update.message.text.replace("/ticket", "").strip()
    
    if "|" not in text:
        await update.message.reply_text(
            "Format invalide. Utilisez :\n`/ticket Sujet | Votre message`",
            parse_mode=ParseMode.MARKDOWN
        )
        return
    
    parts = text.split("|", 1)
    subject = parts[0].strip()[:100]
    message = parts[1].strip()[:2000]
    
    if len(subject) < 3 or len(message) < 5:
        await update.message.reply_text("Le sujet et le message doivent contenir suffisamment de caractères.")
        return
    
    ticket = SupportService.create_ticket(user["id"], update.effective_user.id, subject, message)
    
    await update.message.reply_text(
        f"✅ Ticket créé avec succès !\n\n*Sujet :* {subject}\n\nNotre équipe vous répondra rapidement.",
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=main_menu_keyboard()
    )
    
    # Notify admins
    for admin_id in ADMIN_IDS:
        try:
            await context.bot.send_message(
                chat_id=admin_id,
                text=f"🎫 *Nouveau ticket*\n\nDe: {user['first_name']} (@{user.get('username', 'N/A')})\nSujet: {subject}\n\n{message[:500]}",
                parse_mode=ParseMode.MARKDOWN
            )
        except Exception:
            pass

# Help handler
async def help_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    text = f"""❓ *FAQ — {SHOP_NAME}*

*Comment passer commande ?*
Parcourez la boutique, ajoutez des articles au panier et validez votre commande.

*Moyens de paiement acceptés ?*
Nous acceptons les paiements en crypto-monnaie (BTC, LTC).

*Délais de traitement ?*
Les commandes sont traitées sous 24-48h après confirmation du paiement.

*Comment confirmer mon paiement ?*
Envoyez une preuve de paiement (capture ou hash de transaction) via le support.

*Puis-je annuler une commande ?*
Les annulations sont possibles avant expédition. Contactez le support.

*Besoin d'aide ?*
Utilisez `/ticket` pour contacter notre équipe."""
    
    await query.edit_message_text(
        text,
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("⬅️ Menu", callback_data="menu:home")]])
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
        lines.append(f"{role_icon} {user['first_name']} (@{user.get('username', 'N/A')}) — {user['role']}")
    
    await query.edit_message_text(
        "\n".join(lines),
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=admin_menu_keyboard()
    )

# Admin command handlers
async def order_status_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_staff(update.effective_user.id):
        await update.message.reply_text("Accès refusé.")
        return
    
    args = context.args
    if len(args) < 2:
        await update.message.reply_text("Usage: /order_status <order_id ou order_number> <pending|paid|preparing|shipped|completed|canceled>")
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
    
    user = get_user(update)
    AdminLogService.log(user["id"], update.effective_user.id, "order.status.update", "order", order["id"], {"old": old_status, "new": new_status})
    
    await update.message.reply_text(f"✅ Commande `{updated['order_number']}` : {old_status} → {new_status}", parse_mode=ParseMode.MARKDOWN)
    
    # Notify customer
    try:
        await context.bot.send_message(
            chat_id=order["user_telegram_id"],
            text=f"📦 *Mise à jour de votre commande*\n\nCommande : `{order['order_number']}`\nNouveau statut : *{new_status}*",
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
        await update.message.reply_text("Usage: /order_find <order_id ou order_number>")
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

async def confirm_payment_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_staff(update.effective_user.id):
        await update.message.reply_text("Accès refusé.")
        return
    
    args = context.args
    if not args:
        await update.message.reply_text("Usage: /confirm_payment <order_number> [tx_hash]")
        return
    
    order = OrderService.search(args[0])
    if not order:
        await update.message.reply_text("Commande introuvable.")
        return
    
    payment = PaymentService.get_by_order(order["id"])
    if not payment:
        await update.message.reply_text("Aucun paiement trouvé pour cette commande.")
        return
    
    tx_hash = args[1] if len(args) > 1 else None
    PaymentService.confirm(payment["id"], tx_hash)
    
    admin_user = get_user(update)
    AdminLogService.log(admin_user["id"], update.effective_user.id, "payment.confirm", "payment", payment["id"], {"order": order["order_number"], "tx_hash": tx_hash})
    
    await update.message.reply_text(f"✅ Paiement confirmé pour la commande `{order['order_number']}`", parse_mode=ParseMode.MARKDOWN)
    
    # Notify customer
    try:
        await context.bot.send_message(
            chat_id=order["user_telegram_id"],
            text=f"✅ *Paiement confirmé !*\n\nVotre commande `{order['order_number']}` a été marquée comme payée.\n\nNous la préparons maintenant.",
            parse_mode=ParseMode.MARKDOWN
        )
    except Exception:
        pass

def main():
    init_indexes()
    
    application = Application.builder().token(BOT_TOKEN).build()
    
    # Public commands
    application.add_handler(CommandHandler("start", start_handler))
    application.add_handler(CommandHandler("ticket", ticket_command_handler))
    
    # Admin commands
    application.add_handler(CommandHandler("admin", admin_command_handler))
    application.add_handler(CommandHandler("order_status", order_status_command))
    application.add_handler(CommandHandler("order_find", order_find_command))
    application.add_handler(CommandHandler("confirm_payment", confirm_payment_command))
    application.add_handler(CommandHandler("broadcast", broadcast_command))
    
    # Callback handlers
    application.add_handler(CallbackQueryHandler(menu_home_handler, pattern="^menu:home$"))
    application.add_handler(CallbackQueryHandler(shop_handler, pattern="^menu:shop$"))
    application.add_handler(CallbackQueryHandler(cart_handler, pattern="^menu:cart$"))
    application.add_handler(CallbackQueryHandler(orders_handler, pattern="^menu:orders$"))
    application.add_handler(CallbackQueryHandler(support_handler, pattern="^menu:support$"))
    application.add_handler(CallbackQueryHandler(help_handler, pattern="^menu:help$"))
    
    application.add_handler(CallbackQueryHandler(category_handler, pattern="^cat:"))
    application.add_handler(CallbackQueryHandler(product_handler, pattern="^prd:"))
    application.add_handler(CallbackQueryHandler(add_to_cart_handler, pattern="^add:"))
    
    application.add_handler(CallbackQueryHandler(cart_increment_handler, pattern="^inc:"))
    application.add_handler(CallbackQueryHandler(cart_decrement_handler, pattern="^dec:"))
    application.add_handler(CallbackQueryHandler(cart_clear_handler, pattern="^cart:clear$"))
    application.add_handler(CallbackQueryHandler(checkout_handler, pattern="^cart:checkout$"))
    
    application.add_handler(CallbackQueryHandler(order_detail_handler, pattern="^order:"))
    application.add_handler(CallbackQueryHandler(support_list_handler, pattern="^support:list$"))
    
    # Admin callbacks
    application.add_handler(CallbackQueryHandler(admin_stats_handler, pattern="^admin:stats$"))
    application.add_handler(CallbackQueryHandler(admin_orders_handler, pattern="^admin:orders$"))
    application.add_handler(CallbackQueryHandler(admin_tickets_handler, pattern="^admin:tickets$"))
    application.add_handler(CallbackQueryHandler(admin_users_handler, pattern="^admin:users$"))
    
    logger.info("Bot starting", shop=SHOP_NAME)
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    main()
