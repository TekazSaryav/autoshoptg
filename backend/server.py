"""
Patek Shop - FastAPI Backend Server
"""
import os
from datetime import datetime, timezone
from typing import Optional, List
from contextlib import asynccontextmanager

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, Depends, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import structlog

from models import (
    CategoryCreate, CategoryUpdate, ProductCreate, ProductUpdate,
    OrderStatusUpdate, PaymentConfirm, UserRoleUpdate, BroadcastMessage
)
from database import (
    UserService, CategoryService, ProductService, CartService,
    OrderService, PaymentService, SupportService, AdminLogService,
    init_indexes
)

logger = structlog.get_logger()

# Config
INTERNAL_API_KEY = os.environ.get("INTERNAL_API_KEY", "")
ADMIN_TELEGRAM_IDS = set(int(x.strip()) for x in os.environ.get("ADMIN_TELEGRAM_IDS", "").split(",") if x.strip())

limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_indexes()
    logger.info("API server started")
    yield
    logger.info("API server stopped")

app = FastAPI(
    title="Patek Shop API",
    description="API Backend pour le bot Telegram Patek Shop",
    version="1.0.0",
    lifespan=lifespan
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth dependency
async def verify_api_key(x_api_key: str = Header(None)):
    if not x_api_key or x_api_key != INTERNAL_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return True

# Telegram WebApp auth
import hashlib
import hmac
import json
from urllib.parse import parse_qsl

BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
BTC_ADDRESS = os.environ.get("BTC_ADDRESS", "")
LTC_ADDRESS = os.environ.get("LTC_ADDRESS", "")

def validate_telegram_data(init_data: str) -> dict:
    """Validate Telegram WebApp initData"""
    try:
        parsed = dict(parse_qsl(init_data, keep_blank_values=True))
        hash_value = parsed.pop("hash", "")
        
        data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(parsed.items()))
        secret_key = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
        calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
        
        if calculated_hash != hash_value:
            return None
        
        user_data = json.loads(parsed.get("user", "{}"))
        return user_data
    except Exception:
        return None

async def get_telegram_user(x_telegram_init_data: str = Header(None)):
    """Get user from Telegram initData or demo mode"""
    # Demo mode for testing without Telegram
    if not x_telegram_init_data or x_telegram_init_data == "demo":
        # Return demo user
        user = UserService.get_or_create(
            telegram_id=8387296012,  # Admin ID for demo
            first_name="Demo",
            last_name="User",
            username="demo_user",
            photo_url=None
        )
        return user
    
    user_data = validate_telegram_data(x_telegram_init_data)
    if not user_data:
        # Fallback to demo mode if validation fails
        user = UserService.get_or_create(
            telegram_id=8387296012,
            first_name="Demo",
            last_name="User",
            username="demo_user",
            photo_url=None
        )
        return user
    
    user = UserService.get_or_create(
        telegram_id=user_data.get("id"),
        first_name=user_data.get("first_name", "User"),
        last_name=user_data.get("last_name"),
        username=user_data.get("username"),
        photo_url=user_data.get("photo_url")
    )
    return user

# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}

# ============== WEBAPP ENDPOINTS (for Telegram Mini App) ==============

@app.get("/api/webapp/me")
async def webapp_get_me(user: dict = Depends(get_telegram_user)):
    """Get current user profile"""
    return user

@app.get("/api/webapp/home")
async def webapp_home(user: dict = Depends(get_telegram_user)):
    """Home page data"""
    categories = CategoryService.list_active()
    products_count = ProductService.count()
    
    # Get category stats
    category_stats = []
    for cat in categories:
        count = CategoryService.count_products(cat["id"])
        category_stats.append({
            "id": cat["id"],
            "name": cat["name"],
            "icon": cat.get("icon", "📁"),
            "count": count
        })
    
    return {
        "user": user,
        "balance_cents": user.get("balance_cents", 0),
        "products_count": products_count,
        "categories": category_stats
    }

@app.get("/api/webapp/deposit")
async def webapp_deposit_info(user: dict = Depends(get_telegram_user)):
    """Get deposit addresses"""
    return {
        "btc_address": BTC_ADDRESS,
        "ltc_address": LTC_ADDRESS,
        "user_balance": user.get("balance_cents", 0)
    }

@app.get("/api/webapp/categories")
async def webapp_categories(user: dict = Depends(get_telegram_user)):
    """List categories for shop"""
    categories = CategoryService.list_active()
    result = []
    for cat in categories:
        count = CategoryService.count_products(cat["id"])
        result.append({**cat, "products_count": count})
    return result

@app.get("/api/webapp/categories/{cat_id}/products")
async def webapp_category_products(cat_id: str, user: dict = Depends(get_telegram_user)):
    """Get products in category"""
    category = CategoryService.get_by_id(cat_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    products = ProductService.list_by_category(cat_id)
    return {"category": category, "products": products}

@app.get("/api/webapp/products/{product_id}")
async def webapp_product_detail(product_id: str, user: dict = Depends(get_telegram_user)):
    """Get product details"""
    product = ProductService.get_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.get("/api/webapp/cart")
async def webapp_get_cart(user: dict = Depends(get_telegram_user)):
    """Get user cart"""
    cart = CartService.get_or_create(user["id"])
    total = sum(item["unit_price_cents"] * item["quantity"] for item in cart.get("items", []))
    return {"cart": cart, "total_cents": total, "user_balance": user.get("balance_cents", 0)}

@app.post("/api/webapp/cart/add")
async def webapp_add_to_cart(product_id: str = Query(...), quantity: int = Query(1), user: dict = Depends(get_telegram_user)):
    """Add item to cart"""
    try:
        cart = CartService.add_item(user["id"], product_id, quantity)
        return {"success": True, "cart": cart}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/webapp/cart/update")
async def webapp_update_cart(item_id: str = Query(...), quantity: int = Query(...), user: dict = Depends(get_telegram_user)):
    """Update cart item quantity"""
    cart = CartService.update_item_quantity(user["id"], item_id, quantity)
    return {"success": True, "cart": cart}

@app.post("/api/webapp/cart/clear")
async def webapp_clear_cart(user: dict = Depends(get_telegram_user)):
    """Clear cart"""
    cart = CartService.clear(user["id"])
    return {"success": True, "cart": cart}

@app.post("/api/webapp/checkout")
async def webapp_checkout(user: dict = Depends(get_telegram_user)):
    """Checkout with wallet balance"""
    cart = CartService.get_or_create(user["id"])
    total = sum(item["unit_price_cents"] * item["quantity"] for item in cart.get("items", []))
    
    if not cart.get("items"):
        raise HTTPException(status_code=400, detail="Panier vide")
    
    user_balance = user.get("balance_cents", 0)
    if user_balance < total:
        raise HTTPException(status_code=400, detail=f"Solde insuffisant. Requis: {total/100:.2f}€, Disponible: {user_balance/100:.2f}€")
    
    # Deduct balance
    if not UserService.deduct_balance(user["id"], total):
        raise HTTPException(status_code=400, detail="Erreur de paiement")
    
    # Create order
    try:
        order = OrderService.create_from_cart(user["id"], user["telegram_id"])
        # Mark as paid since we used wallet
        OrderService.update_status(order["id"], "paid")
        
        # Create payment record
        PaymentService.create(
            order_id=order["id"],
            order_number=order["order_number"],
            method="wallet",
            amount_cents=total,
            crypto_address=None
        )
        
        return {"success": True, "order": order}
    except ValueError as e:
        # Refund if order creation failed
        UserService.add_balance(user["id"], total)
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/webapp/orders")
async def webapp_orders(user: dict = Depends(get_telegram_user)):
    """Get user orders"""
    orders = OrderService.list_by_user(user["id"])
    return orders

@app.get("/api/webapp/orders/{order_id}")
async def webapp_order_detail(order_id: str, user: dict = Depends(get_telegram_user)):
    """Get order details"""
    order = OrderService.get_by_id(order_id)
    if not order or order["user_id"] != user["id"]:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@app.get("/api/webapp/tickets")
async def webapp_tickets(user: dict = Depends(get_telegram_user)):
    """Get user support tickets"""
    return SupportService.list_by_user(user["id"])

@app.post("/api/webapp/tickets")
async def webapp_create_ticket(subject: str = Query(..., min_length=3), message: str = Query(..., min_length=5), user: dict = Depends(get_telegram_user)):
    """Create support ticket"""
    ticket = SupportService.create_ticket(user["id"], user["telegram_id"], subject, message)
    return ticket

@app.get("/api/webapp/tickets/{ticket_id}")
async def webapp_ticket_detail(ticket_id: str, user: dict = Depends(get_telegram_user)):
    """Get ticket details"""
    ticket = SupportService.get_by_id(ticket_id)
    if not ticket or ticket["user_id"] != user["id"]:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket

@app.post("/api/webapp/tickets/{ticket_id}/reply")
async def webapp_ticket_reply(ticket_id: str, message: str = Query(..., min_length=1), user: dict = Depends(get_telegram_user)):
    """Reply to ticket"""
    ticket = SupportService.get_by_id(ticket_id)
    if not ticket or ticket["user_id"] != user["id"]:
        raise HTTPException(status_code=404, detail="Ticket not found")
    updated = SupportService.add_reply(ticket_id, "user", message)
    return updated

# ============== ADMIN ENDPOINTS ==============

# Dashboard stats
@app.get("/api/admin/stats")
async def get_stats(auth: bool = Depends(verify_api_key)):
    return {
        "users": UserService.count(),
        "products": ProductService.count(),
        "orders": {
            "pending": OrderService.count("pending"),
            "paid": OrderService.count("paid"),
            "preparing": OrderService.count("preparing"),
            "shipped": OrderService.count("shipped"),
            "completed": OrderService.count("completed"),
            "canceled": OrderService.count("canceled"),
            "total": OrderService.count()
        },
        "tickets": {
            "open": SupportService.count("open"),
            "in_progress": SupportService.count("in_progress"),
            "resolved": SupportService.count("resolved"),
            "total": SupportService.count()
        }
    }

# Users
@app.get("/api/admin/users")
async def list_users(auth: bool = Depends(verify_api_key), limit: int = Query(100, le=500)):
    return UserService.list_all(limit)

@app.get("/api/admin/users/{user_id}")
async def get_user(user_id: str, auth: bool = Depends(verify_api_key)):
    user = UserService.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.post("/api/admin/users/{user_id}/balance")
async def add_user_balance(user_id: str, amount_cents: int = Query(...), auth: bool = Depends(verify_api_key)):
    """Add balance to user wallet"""
    user = UserService.add_balance(user_id, amount_cents)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.patch("/api/admin/users/{user_id}/role")
async def update_user_role(user_id: str, data: UserRoleUpdate, auth: bool = Depends(verify_api_key)):
    user = UserService.update_role(user_id, data.role.value)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Categories
@app.get("/api/admin/categories")
async def list_categories(auth: bool = Depends(verify_api_key)):
    return CategoryService.list_all()

@app.get("/api/categories")
async def list_public_categories():
    return CategoryService.list_active()

@app.post("/api/admin/categories")
async def create_category(data: CategoryCreate, auth: bool = Depends(verify_api_key)):
    try:
        return CategoryService.create(data.slug, data.name, data.description, data.icon, data.position)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/admin/categories/{cat_id}")
async def get_category(cat_id: str, auth: bool = Depends(verify_api_key)):
    category = CategoryService.get_by_id(cat_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@app.patch("/api/admin/categories/{cat_id}")
async def update_category(cat_id: str, data: CategoryUpdate, auth: bool = Depends(verify_api_key)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    category = CategoryService.update(cat_id, update_data)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@app.delete("/api/admin/categories/{cat_id}")
async def delete_category(cat_id: str, auth: bool = Depends(verify_api_key)):
    if not CategoryService.delete(cat_id):
        raise HTTPException(status_code=404, detail="Category not found")
    return {"success": True}

# Products
@app.get("/api/admin/products")
async def list_products(auth: bool = Depends(verify_api_key), limit: int = Query(200, le=500)):
    return ProductService.list_all(limit)

@app.get("/api/products")
async def list_public_products(category_id: Optional[str] = None):
    if category_id:
        return ProductService.list_by_category(category_id)
    return ProductService.list_all(100)

@app.post("/api/admin/products")
async def create_product(data: ProductCreate, auth: bool = Depends(verify_api_key)):
    try:
        return ProductService.create(
            data.category_id, data.sku, data.title, data.description,
            data.price_cents, data.stock, data.image_urls
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/admin/products/{product_id}")
async def get_product(product_id: str, auth: bool = Depends(verify_api_key)):
    product = ProductService.get_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.patch("/api/admin/products/{product_id}")
async def update_product(product_id: str, data: ProductUpdate, auth: bool = Depends(verify_api_key)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    product = ProductService.update(product_id, update_data)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.delete("/api/admin/products/{product_id}")
async def delete_product(product_id: str, auth: bool = Depends(verify_api_key)):
    if not ProductService.delete(product_id):
        raise HTTPException(status_code=404, detail="Product not found")
    return {"success": True}

# Orders
@app.get("/api/admin/orders")
async def list_orders(
    auth: bool = Depends(verify_api_key),
    status: Optional[str] = None,
    limit: int = Query(100, le=500)
):
    return OrderService.list_all(limit, status)

@app.get("/api/admin/orders/{order_id}")
async def get_order(order_id: str, auth: bool = Depends(verify_api_key)):
    order = OrderService.get_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@app.get("/api/admin/orders/search/{query}")
async def search_order(query: str, auth: bool = Depends(verify_api_key)):
    order = OrderService.search(query)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@app.patch("/api/admin/orders/{order_id}/status")
async def update_order_status(order_id: str, data: OrderStatusUpdate, auth: bool = Depends(verify_api_key)):
    order = OrderService.update_status(order_id, data.status.value)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

# Payments
@app.get("/api/admin/payments/{order_id}")
async def get_payment(order_id: str, auth: bool = Depends(verify_api_key)):
    payment = PaymentService.get_by_order(order_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment

@app.post("/api/admin/payments/{payment_id}/confirm")
async def confirm_payment(payment_id: str, data: PaymentConfirm, auth: bool = Depends(verify_api_key)):
    payment = PaymentService.confirm(payment_id, data.tx_hash)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment

# Support Tickets
@app.get("/api/admin/tickets")
async def list_tickets(
    auth: bool = Depends(verify_api_key),
    status: Optional[str] = None,
    limit: int = Query(50, le=200)
):
    return SupportService.list_all(status, limit)

@app.get("/api/admin/tickets/{ticket_id}")
async def get_ticket(ticket_id: str, auth: bool = Depends(verify_api_key)):
    ticket = SupportService.get_by_id(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket

@app.post("/api/admin/tickets/{ticket_id}/reply")
async def reply_ticket(ticket_id: str, message: str = Query(..., min_length=1), auth: bool = Depends(verify_api_key)):
    ticket = SupportService.add_reply(ticket_id, "staff", message)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket

@app.patch("/api/admin/tickets/{ticket_id}/status")
async def update_ticket_status(ticket_id: str, status: str = Query(...), auth: bool = Depends(verify_api_key)):
    ticket = SupportService.update_status(ticket_id, status)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket

# Admin Logs
@app.get("/api/admin/logs")
async def list_admin_logs(auth: bool = Depends(verify_api_key), limit: int = Query(50, le=200)):
    return AdminLogService.list_recent(limit)

# Seed data endpoint (for initial setup)
@app.post("/api/admin/seed")
async def seed_data(auth: bool = Depends(verify_api_key)):
    # Create demo categories
    categories = [
        {"slug": "electronics", "name": "Électronique", "description": "Appareils électroniques", "icon": "📱", "position": 1},
        {"slug": "fashion", "name": "Mode", "description": "Vêtements et accessoires", "icon": "👕", "position": 2},
        {"slug": "digital", "name": "Digital", "description": "Produits numériques", "icon": "💾", "position": 3},
    ]
    
    created_cats = []
    for cat in categories:
        try:
            created = CategoryService.create(cat["slug"], cat["name"], cat["description"], cat["icon"], cat["position"])
            created_cats.append(created)
        except Exception:
            existing = next((c for c in CategoryService.list_all() if c["slug"] == cat["slug"]), None)
            if existing:
                created_cats.append(existing)
    
    # Create demo products
    products = [
        {"sku": "ELEC-001", "title": "Smartphone Pro Max", "description": "Dernier modèle avec écran AMOLED 6.7 pouces, 256GB stockage.", "price_cents": 89900, "stock": 15, "image_urls": ["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400"]},
        {"sku": "ELEC-002", "title": "Écouteurs Sans Fil", "description": "Écouteurs Bluetooth avec réduction de bruit active.", "price_cents": 14900, "stock": 50, "image_urls": ["https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400"]},
        {"sku": "FASH-001", "title": "Montre Classique", "description": "Montre élégante en acier inoxydable, mouvement automatique.", "price_cents": 29900, "stock": 20, "image_urls": ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400"]},
        {"sku": "FASH-002", "title": "Sac en Cuir", "description": "Sac à main en cuir véritable, design premium.", "price_cents": 19900, "stock": 10, "image_urls": ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400"]},
        {"sku": "DIGI-001", "title": "Licence Logiciel Pro", "description": "Licence annuelle pour logiciel professionnel.", "price_cents": 9900, "stock": 100, "image_urls": []},
        {"sku": "DIGI-002", "title": "E-Book Pack", "description": "Collection de 50 e-books business et développement personnel.", "price_cents": 4900, "stock": 999, "image_urls": []},
    ]
    
    created_products = []
    cat_map = {"ELEC": 0, "FASH": 1, "DIGI": 2}
    
    for prod in products:
        prefix = prod["sku"].split("-")[0]
        cat_idx = cat_map.get(prefix, 0)
        if cat_idx < len(created_cats):
            try:
                created = ProductService.create(
                    created_cats[cat_idx]["id"],
                    prod["sku"],
                    prod["title"],
                    prod["description"],
                    prod["price_cents"],
                    prod["stock"],
                    prod["image_urls"]
                )
                created_products.append(created)
            except Exception:
                pass
    
    return {
        "success": True,
        "categories_created": len(created_cats),
        "products_created": len(created_products)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
