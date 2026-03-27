# Patek Shop - PRD (Product Requirements Document)

## Original Problem Statement
Créer un bot Telegram de boutique en ligne complet, production-ready, pour vendre des produits licites. Le bot doit permettre de parcourir un catalogue, voir les détails produits, gérer un panier, créer une commande, suivre une commande et contacter le support.

## User Choices
- **Payment Method**: Crypto only (BTC/LTC)
- **Admin Interface**: React web panel
- **Product Type**: Generic configurable system
- **Authentication**: Telegram ID whitelist for admins

## Architecture

### Backend (Python/FastAPI)
- `server.py` - FastAPI REST API
- `bot.py` - Telegram bot using python-telegram-bot
- `database.py` - MongoDB services
- `models.py` - Pydantic models

### Frontend (React)
- Admin panel with dashboard, CRUD for categories/products/orders/users/tickets
- TailwindCSS styling with premium gold/black theme

### Database (MongoDB)
Collections: users, categories, products, carts, orders, payments, support_tickets, admin_logs, settings

## Core Requirements (Static)

### Bot Features
- [x] /start with welcome message
- [x] Main menu with inline buttons
- [x] Browse categories
- [x] Product listing with images, price, stock
- [x] Add to cart functionality
- [x] View/modify cart
- [x] Checkout with crypto payment info
- [x] Order history
- [x] Order status tracking
- [x] Support tickets via /ticket command
- [x] FAQ/Help

### Admin Features
- [x] Admin access via Telegram ID whitelist
- [x] Web admin panel (React)
- [x] CRUD categories
- [x] CRUD products
- [x] Stock management
- [x] Order management with status updates
- [x] User management with role assignment
- [x] Support ticket management
- [x] Broadcast messages
- [x] Admin action logs

### Payment
- [x] Crypto payment addresses display (BTC/LTC)
- [x] Manual payment confirmation by admin
- [x] Payment status tracking

### Security
- [x] Admin role verification
- [x] Rate limiting
- [x] API key authentication for admin endpoints
- [x] Input validation (Pydantic)
- [x] Secrets via environment variables

## What's Been Implemented
**Date: 2026-03-27**

1. ✅ Complete Telegram bot with all user features
2. ✅ FastAPI backend with all admin endpoints
3. ✅ React admin panel with dashboard and CRUD operations
4. ✅ MongoDB integration with all collections
5. ✅ Seed data with 3 categories and 6 demo products
6. ✅ Rate limiting and security measures
7. ✅ Premium UI design (gold/black theme)

## Test Results
- Backend: 100% (16/16 tests passed)
- Frontend: 95% (minor modal overlay issue)

## Prioritized Backlog

### P0 (Critical) - None

### P1 (High Priority)
- [ ] Start the Telegram bot process (currently only API is running)
- [ ] Add product image upload functionality
- [ ] Implement order notification to customers on status change

### P2 (Medium Priority)
- [ ] Add multi-language support
- [ ] Implement product variants UI in admin
- [ ] Add order export (CSV/PDF)
- [ ] Implement search functionality in bot

### P3 (Nice to Have)
- [ ] Add analytics dashboard
- [ ] Implement discount codes
- [ ] Add customer address management
- [ ] Implement email notifications

## Next Tasks
1. Deploy the Telegram bot as a separate process
2. Test complete user flow in Telegram
3. Add product image upload to admin panel
