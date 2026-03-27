"""
Patek Shop - MongoDB Models
"""
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum

class UserRole(str, Enum):
    CLIENT = "client"
    STAFF = "staff"
    ADMIN = "admin"

class OrderStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    PREPARING = "preparing"
    SHIPPED = "shipped"
    COMPLETED = "completed"
    CANCELED = "canceled"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    FAILED = "failed"
    CANCELED = "canceled"

class TicketStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"

class PaymentMethod(str, Enum):
    CRYPTO_BTC = "crypto_btc"
    CRYPTO_LTC = "crypto_ltc"
    MANUAL = "manual"

# Base Models
class UserModel(BaseModel):
    id: str
    telegram_id: int
    username: Optional[str] = None
    first_name: str
    last_name: Optional[str] = None
    role: UserRole = UserRole.CLIENT
    locale: str = "fr"
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AddressModel(BaseModel):
    id: str
    user_id: str
    label: str
    line1: str
    line2: Optional[str] = None
    city: str
    postal_code: str
    country_code: str = "FR"
    phone: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CategoryModel(BaseModel):
    id: str
    slug: str
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    is_active: bool = True
    position: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductImageModel(BaseModel):
    id: str
    url: str
    position: int = 0
    alt: Optional[str] = None

class ProductVariant(BaseModel):
    key: str
    label: str
    price_adjustment: int = 0  # cents
    stock: int = 0

class ProductModel(BaseModel):
    id: str
    category_id: str
    sku: str
    title: str
    description: str
    price_cents: int
    currency: str = "EUR"
    stock: int = 0
    variants: List[ProductVariant] = []
    images: List[ProductImageModel] = []
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CartItemModel(BaseModel):
    id: str
    product_id: str
    product_title: str
    quantity: int = 1
    unit_price_cents: int
    variant_key: Optional[str] = None

class CartModel(BaseModel):
    id: str
    user_id: str
    items: List[CartItemModel] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderItemModel(BaseModel):
    id: str
    product_id: str
    title: str
    quantity: int
    unit_price_cents: int
    total_price_cents: int
    variant_key: Optional[str] = None

class OrderModel(BaseModel):
    id: str
    order_number: str
    user_id: str
    user_telegram_id: int
    address_id: Optional[str] = None
    status: OrderStatus = OrderStatus.PENDING
    currency: str = "EUR"
    subtotal_cents: int
    shipping_cents: int = 0
    total_cents: int
    items: List[OrderItemModel] = []
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PaymentModel(BaseModel):
    id: str
    order_id: str
    order_number: str
    method: PaymentMethod
    status: PaymentStatus = PaymentStatus.PENDING
    amount_cents: int
    currency: str = "EUR"
    crypto_address: Optional[str] = None
    tx_hash: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    confirmed_at: Optional[datetime] = None

class SupportTicketModel(BaseModel):
    id: str
    user_id: str
    user_telegram_id: int
    assignee_id: Optional[str] = None
    subject: str
    messages: List[dict] = []
    status: TicketStatus = TicketStatus.OPEN
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AdminLogModel(BaseModel):
    id: str
    actor_id: str
    actor_telegram_id: int
    action: str
    target_type: str
    target_id: Optional[str] = None
    metadata: Optional[dict] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SettingModel(BaseModel):
    key: str
    value: dict
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# API Request/Response Models
class CategoryCreate(BaseModel):
    slug: str
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    position: int = 0

class CategoryUpdate(BaseModel):
    slug: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    is_active: Optional[bool] = None
    position: Optional[int] = None

class ProductCreate(BaseModel):
    category_id: str
    sku: str
    title: str
    description: str
    price_cents: int
    stock: int = 0
    image_urls: List[str] = []

class ProductUpdate(BaseModel):
    category_id: Optional[str] = None
    sku: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    price_cents: Optional[int] = None
    stock: Optional[int] = None
    is_active: Optional[bool] = None

class OrderStatusUpdate(BaseModel):
    status: OrderStatus

class PaymentConfirm(BaseModel):
    tx_hash: Optional[str] = None

class UserRoleUpdate(BaseModel):
    role: UserRole

class BroadcastMessage(BaseModel):
    message: str
    target: str = "all"  # all, active
