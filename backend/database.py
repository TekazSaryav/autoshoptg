"""
Patek Shop - Database Connection & Services
"""
import os
from datetime import datetime, timezone
from typing import Optional, List
from pymongo import MongoClient
from nanoid import generate
import structlog

logger = structlog.get_logger()

# Database connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "patek_shop")

client = MongoClient(MONGO_URL)
db = client[DB_NAME]

# Collections
users_col = db["users"]
addresses_col = db["addresses"]
categories_col = db["categories"]
products_col = db["products"]
carts_col = db["carts"]
orders_col = db["orders"]
payments_col = db["payments"]
support_tickets_col = db["support_tickets"]
admin_logs_col = db["admin_logs"]
settings_col = db["settings"]

# Create indexes
def init_indexes():
    users_col.create_index("telegram_id", unique=True)
    users_col.create_index("role")
    categories_col.create_index("slug", unique=True)
    products_col.create_index("category_id")
    products_col.create_index("sku", unique=True)
    products_col.create_index("is_active")
    carts_col.create_index("user_id", unique=True)
    orders_col.create_index("user_id")
    orders_col.create_index("order_number", unique=True)
    orders_col.create_index("status")
    payments_col.create_index("order_id")
    support_tickets_col.create_index("user_id")
    support_tickets_col.create_index("status")
    admin_logs_col.create_index("actor_id")
    admin_logs_col.create_index("created_at")
    logger.info("Database indexes created")

def generate_id() -> str:
    return generate(size=16)

def generate_order_number() -> str:
    return f"PS-{generate(alphabet='0123456789ABCDEF', size=8)}"

def now_utc() -> datetime:
    return datetime.now(timezone.utc)

def serialize_doc(doc: dict) -> dict:
    if doc is None:
        return None
    doc.pop("_id", None)
    return doc

def serialize_docs(docs: list) -> list:
    return [serialize_doc(d) for d in docs]

# User Service
class UserService:
    @staticmethod
    def get_or_create(telegram_id: int, first_name: str, last_name: str = None, username: str = None, photo_url: str = None) -> dict:
        user = users_col.find_one({"telegram_id": telegram_id}, {"_id": 0})
        if user:
            users_col.update_one(
                {"telegram_id": telegram_id},
                {"$set": {"first_name": first_name, "last_name": last_name, "username": username, "photo_url": photo_url, "updated_at": now_utc()}}
            )
            return serialize_doc(users_col.find_one({"telegram_id": telegram_id}, {"_id": 0}))
        
        new_user = {
            "id": generate_id(),
            "telegram_id": telegram_id,
            "username": username,
            "first_name": first_name,
            "last_name": last_name,
            "photo_url": photo_url,
            "role": "client",
            "locale": "fr",
            "balance_cents": 0,
            "is_active": True,
            "created_at": now_utc(),
            "updated_at": now_utc()
        }
        users_col.insert_one(new_user)
        return serialize_doc(new_user)
    
    @staticmethod
    def add_balance(user_id: str, amount_cents: int) -> dict:
        users_col.update_one(
            {"id": user_id},
            {"$inc": {"balance_cents": amount_cents}, "$set": {"updated_at": now_utc()}}
        )
        return serialize_doc(users_col.find_one({"id": user_id}, {"_id": 0}))
    
    @staticmethod
    def deduct_balance(user_id: str, amount_cents: int) -> bool:
        result = users_col.update_one(
            {"id": user_id, "balance_cents": {"$gte": amount_cents}},
            {"$inc": {"balance_cents": -amount_cents}, "$set": {"updated_at": now_utc()}}
        )
        return result.modified_count > 0
    
    @staticmethod
    def get_by_id(user_id: str) -> Optional[dict]:
        return serialize_doc(users_col.find_one({"id": user_id}, {"_id": 0}))
    
    @staticmethod
    def get_by_telegram_id(telegram_id: int) -> Optional[dict]:
        return serialize_doc(users_col.find_one({"telegram_id": telegram_id}, {"_id": 0}))
    
    @staticmethod
    def list_all(limit: int = 100) -> List[dict]:
        return serialize_docs(list(users_col.find({}, {"_id": 0}).sort("created_at", -1).limit(limit)))
    
    @staticmethod
    def list_active() -> List[dict]:
        return serialize_docs(list(users_col.find({"is_active": True}, {"_id": 0})))
    
    @staticmethod
    def update_role(user_id: str, role: str) -> Optional[dict]:
        users_col.update_one({"id": user_id}, {"$set": {"role": role, "updated_at": now_utc()}})
        return serialize_doc(users_col.find_one({"id": user_id}, {"_id": 0}))
    
    @staticmethod
    def count() -> int:
        return users_col.count_documents({})

# Category Service
class CategoryService:
    @staticmethod
    def create(slug: str, name: str, description: str = None, icon: str = None, position: int = 0) -> dict:
        category = {
            "id": generate_id(),
            "slug": slug,
            "name": name,
            "description": description,
            "icon": icon,
            "is_active": True,
            "position": position,
            "created_at": now_utc(),
            "updated_at": now_utc()
        }
        categories_col.insert_one(category)
        return serialize_doc(category)
    
    @staticmethod
    def list_active() -> List[dict]:
        return serialize_docs(list(categories_col.find({"is_active": True}, {"_id": 0}).sort("position", 1)))
    
    @staticmethod
    def list_all() -> List[dict]:
        return serialize_docs(list(categories_col.find({}, {"_id": 0}).sort("position", 1)))
    
    @staticmethod
    def get_by_id(cat_id: str) -> Optional[dict]:
        return serialize_doc(categories_col.find_one({"id": cat_id}, {"_id": 0}))
    
    @staticmethod
    def update(cat_id: str, data: dict) -> Optional[dict]:
        data["updated_at"] = now_utc()
        categories_col.update_one({"id": cat_id}, {"$set": data})
        return serialize_doc(categories_col.find_one({"id": cat_id}, {"_id": 0}))
    
    @staticmethod
    def delete(cat_id: str) -> bool:
        result = categories_col.delete_one({"id": cat_id})
        return result.deleted_count > 0
    
    @staticmethod
    def count_products(cat_id: str) -> int:
        return products_col.count_documents({"category_id": cat_id, "is_active": True})

# Product Service
class ProductService:
    @staticmethod
    def create(category_id: str, sku: str, title: str, description: str, price_cents: int, stock: int = 0, image_urls: List[str] = None) -> dict:
        images = []
        if image_urls:
            for i, url in enumerate(image_urls):
                images.append({"id": generate_id(), "url": url, "position": i, "alt": title})
        
        product = {
            "id": generate_id(),
            "category_id": category_id,
            "sku": sku,
            "title": title,
            "description": description,
            "price_cents": price_cents,
            "currency": "EUR",
            "stock": stock,
            "variants": [],
            "images": images,
            "is_active": True,
            "created_at": now_utc(),
            "updated_at": now_utc()
        }
        products_col.insert_one(product)
        return serialize_doc(product)
    
    @staticmethod
    def list_by_category(category_id: str, active_only: bool = True) -> List[dict]:
        query = {"category_id": category_id}
        if active_only:
            query["is_active"] = True
        return serialize_docs(list(products_col.find(query, {"_id": 0}).sort("created_at", -1)))
    
    @staticmethod
    def list_all(limit: int = 200) -> List[dict]:
        return serialize_docs(list(products_col.find({}, {"_id": 0}).sort("created_at", -1).limit(limit)))
    
    @staticmethod
    def get_by_id(product_id: str) -> Optional[dict]:
        return serialize_doc(products_col.find_one({"id": product_id}, {"_id": 0}))
    
    @staticmethod
    def update(product_id: str, data: dict) -> Optional[dict]:
        data["updated_at"] = now_utc()
        products_col.update_one({"id": product_id}, {"$set": data})
        return serialize_doc(products_col.find_one({"id": product_id}, {"_id": 0}))
    
    @staticmethod
    def update_stock(product_id: str, quantity: int) -> bool:
        result = products_col.update_one(
            {"id": product_id, "stock": {"$gte": quantity}},
            {"$inc": {"stock": -quantity}, "$set": {"updated_at": now_utc()}}
        )
        return result.modified_count > 0
    
    @staticmethod
    def delete(product_id: str) -> bool:
        result = products_col.delete_one({"id": product_id})
        return result.deleted_count > 0
    
    @staticmethod
    def count() -> int:
        return products_col.count_documents({"is_active": True})

# Cart Service
class CartService:
    @staticmethod
    def get_or_create(user_id: str) -> dict:
        cart = carts_col.find_one({"user_id": user_id}, {"_id": 0})
        if cart:
            return serialize_doc(cart)
        
        new_cart = {
            "id": generate_id(),
            "user_id": user_id,
            "items": [],
            "created_at": now_utc(),
            "updated_at": now_utc()
        }
        carts_col.insert_one(new_cart)
        return serialize_doc(new_cart)
    
    @staticmethod
    def add_item(user_id: str, product_id: str, quantity: int = 1, variant_key: str = None) -> dict:
        product = ProductService.get_by_id(product_id)
        if not product or not product["is_active"] or product["stock"] < quantity:
            raise ValueError("Produit indisponible")
        
        cart = CartService.get_or_create(user_id)
        items = cart.get("items", [])
        
        # Check if item exists
        for item in items:
            if item["product_id"] == product_id and item.get("variant_key") == variant_key:
                item["quantity"] += quantity
                carts_col.update_one({"user_id": user_id}, {"$set": {"items": items, "updated_at": now_utc()}})
                return serialize_doc(carts_col.find_one({"user_id": user_id}, {"_id": 0}))
        
        # Add new item
        new_item = {
            "id": generate_id(),
            "product_id": product_id,
            "product_title": product["title"],
            "quantity": quantity,
            "unit_price_cents": product["price_cents"],
            "variant_key": variant_key
        }
        items.append(new_item)
        carts_col.update_one({"user_id": user_id}, {"$set": {"items": items, "updated_at": now_utc()}})
        return serialize_doc(carts_col.find_one({"user_id": user_id}, {"_id": 0}))
    
    @staticmethod
    def update_item_quantity(user_id: str, item_id: str, quantity: int) -> dict:
        cart = CartService.get_or_create(user_id)
        items = cart.get("items", [])
        
        if quantity <= 0:
            items = [i for i in items if i["id"] != item_id]
        else:
            for item in items:
                if item["id"] == item_id:
                    item["quantity"] = quantity
                    break
        
        carts_col.update_one({"user_id": user_id}, {"$set": {"items": items, "updated_at": now_utc()}})
        return serialize_doc(carts_col.find_one({"user_id": user_id}, {"_id": 0}))
    
    @staticmethod
    def clear(user_id: str) -> dict:
        carts_col.update_one({"user_id": user_id}, {"$set": {"items": [], "updated_at": now_utc()}})
        return serialize_doc(carts_col.find_one({"user_id": user_id}, {"_id": 0}))
    
    @staticmethod
    def get_total(user_id: str) -> int:
        cart = CartService.get_or_create(user_id)
        return sum(item["unit_price_cents"] * item["quantity"] for item in cart.get("items", []))

# Order Service
class OrderService:
    @staticmethod
    def create_from_cart(user_id: str, user_telegram_id: int) -> dict:
        cart = CartService.get_or_create(user_id)
        items = cart.get("items", [])
        
        if not items:
            raise ValueError("Panier vide")
        
        # Validate stock and build order items
        order_items = []
        subtotal = 0
        
        for cart_item in items:
            product = ProductService.get_by_id(cart_item["product_id"])
            if not product or product["stock"] < cart_item["quantity"]:
                raise ValueError(f"Stock insuffisant pour {cart_item['product_title']}")
            
            total_price = cart_item["unit_price_cents"] * cart_item["quantity"]
            order_items.append({
                "id": generate_id(),
                "product_id": cart_item["product_id"],
                "title": cart_item["product_title"],
                "quantity": cart_item["quantity"],
                "unit_price_cents": cart_item["unit_price_cents"],
                "total_price_cents": total_price,
                "variant_key": cart_item.get("variant_key")
            })
            subtotal += total_price
        
        order = {
            "id": generate_id(),
            "order_number": generate_order_number(),
            "user_id": user_id,
            "user_telegram_id": user_telegram_id,
            "status": "pending",
            "currency": "EUR",
            "subtotal_cents": subtotal,
            "shipping_cents": 0,
            "total_cents": subtotal,
            "items": order_items,
            "created_at": now_utc(),
            "updated_at": now_utc()
        }
        
        orders_col.insert_one(order)
        
        # Decrement stock
        for cart_item in items:
            ProductService.update_stock(cart_item["product_id"], cart_item["quantity"])
        
        # Clear cart
        CartService.clear(user_id)
        
        return serialize_doc(order)
    
    @staticmethod
    def list_by_user(user_id: str, limit: int = 20) -> List[dict]:
        return serialize_docs(list(orders_col.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).limit(limit)))
    
    @staticmethod
    def list_all(limit: int = 100, status: str = None) -> List[dict]:
        query = {}
        if status:
            query["status"] = status
        return serialize_docs(list(orders_col.find(query, {"_id": 0}).sort("created_at", -1).limit(limit)))
    
    @staticmethod
    def get_by_id(order_id: str) -> Optional[dict]:
        return serialize_doc(orders_col.find_one({"id": order_id}, {"_id": 0}))
    
    @staticmethod
    def get_by_number(order_number: str) -> Optional[dict]:
        return serialize_doc(orders_col.find_one({"order_number": order_number}, {"_id": 0}))
    
    @staticmethod
    def search(query: str) -> Optional[dict]:
        order = orders_col.find_one({"$or": [{"id": query}, {"order_number": query}]}, {"_id": 0})
        return serialize_doc(order)
    
    @staticmethod
    def update_status(order_id: str, status: str) -> Optional[dict]:
        orders_col.update_one({"id": order_id}, {"$set": {"status": status, "updated_at": now_utc()}})
        return serialize_doc(orders_col.find_one({"id": order_id}, {"_id": 0}))
    
    @staticmethod
    def count(status: str = None) -> int:
        query = {}
        if status:
            query["status"] = status
        return orders_col.count_documents(query)

# Payment Service
class PaymentService:
    @staticmethod
    def create(order_id: str, order_number: str, method: str, amount_cents: int, crypto_address: str = None) -> dict:
        payment = {
            "id": generate_id(),
            "order_id": order_id,
            "order_number": order_number,
            "method": method,
            "status": "pending",
            "amount_cents": amount_cents,
            "currency": "EUR",
            "crypto_address": crypto_address,
            "tx_hash": None,
            "created_at": now_utc(),
            "confirmed_at": None
        }
        payments_col.insert_one(payment)
        return serialize_doc(payment)
    
    @staticmethod
    def get_by_order(order_id: str) -> Optional[dict]:
        return serialize_doc(payments_col.find_one({"order_id": order_id}, {"_id": 0}))
    
    @staticmethod
    def confirm(payment_id: str, tx_hash: str = None) -> Optional[dict]:
        payments_col.update_one(
            {"id": payment_id},
            {"$set": {"status": "confirmed", "tx_hash": tx_hash, "confirmed_at": now_utc()}}
        )
        payment = payments_col.find_one({"id": payment_id}, {"_id": 0})
        if payment:
            OrderService.update_status(payment["order_id"], "paid")
        return serialize_doc(payment)

# Support Service
class SupportService:
    @staticmethod
    def create_ticket(user_id: str, user_telegram_id: int, subject: str, message: str) -> dict:
        ticket = {
            "id": generate_id(),
            "user_id": user_id,
            "user_telegram_id": user_telegram_id,
            "assignee_id": None,
            "subject": subject,
            "messages": [{"from": "user", "text": message, "at": now_utc().isoformat()}],
            "status": "open",
            "created_at": now_utc(),
            "updated_at": now_utc()
        }
        support_tickets_col.insert_one(ticket)
        return serialize_doc(ticket)
    
    @staticmethod
    def list_by_user(user_id: str) -> List[dict]:
        return serialize_docs(list(support_tickets_col.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1)))
    
    @staticmethod
    def list_all(status: str = None, limit: int = 50) -> List[dict]:
        query = {}
        if status:
            query["status"] = status
        return serialize_docs(list(support_tickets_col.find(query, {"_id": 0}).sort("created_at", -1).limit(limit)))
    
    @staticmethod
    def get_by_id(ticket_id: str) -> Optional[dict]:
        return serialize_doc(support_tickets_col.find_one({"id": ticket_id}, {"_id": 0}))
    
    @staticmethod
    def add_reply(ticket_id: str, from_type: str, text: str) -> Optional[dict]:
        support_tickets_col.update_one(
            {"id": ticket_id},
            {
                "$push": {"messages": {"from": from_type, "text": text, "at": now_utc().isoformat()}},
                "$set": {"updated_at": now_utc()}
            }
        )
        return serialize_doc(support_tickets_col.find_one({"id": ticket_id}, {"_id": 0}))
    
    @staticmethod
    def update_status(ticket_id: str, status: str) -> Optional[dict]:
        support_tickets_col.update_one({"id": ticket_id}, {"$set": {"status": status, "updated_at": now_utc()}})
        return serialize_doc(support_tickets_col.find_one({"id": ticket_id}, {"_id": 0}))
    
    @staticmethod
    def count(status: str = None) -> int:
        query = {}
        if status:
            query["status"] = status
        return support_tickets_col.count_documents(query)

# Admin Log Service
class AdminLogService:
    @staticmethod
    def log(actor_id: str, actor_telegram_id: int, action: str, target_type: str, target_id: str = None, metadata: dict = None):
        log_entry = {
            "id": generate_id(),
            "actor_id": actor_id,
            "actor_telegram_id": actor_telegram_id,
            "action": action,
            "target_type": target_type,
            "target_id": target_id,
            "metadata": metadata,
            "created_at": now_utc()
        }
        admin_logs_col.insert_one(log_entry)
        logger.info("admin_action", action=action, actor=actor_telegram_id, target_type=target_type, target_id=target_id)
    
    @staticmethod
    def list_recent(limit: int = 50) -> List[dict]:
        return serialize_docs(list(admin_logs_col.find({}, {"_id": 0}).sort("created_at", -1).limit(limit)))

# Settings Service
class SettingsService:
    @staticmethod
    def get(key: str, default: dict = None) -> dict:
        setting = settings_col.find_one({"key": key}, {"_id": 0})
        if setting:
            return setting.get("value", default)
        return default
    
    @staticmethod
    def set(key: str, value: dict):
        settings_col.update_one(
            {"key": key},
            {"$set": {"key": key, "value": value, "updated_at": now_utc()}},
            upsert=True
        )
