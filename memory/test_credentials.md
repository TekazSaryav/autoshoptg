# Test Credentials - Patek Shop

## Admin Panel API
- **API Key**: `patek_shop_secret_key_2024_secure`
- **Header**: `X-API-Key`

## WebApp API (Mini App)
- **Header**: `X-Telegram-Init-Data: demo` (for testing without Telegram)

## Telegram Bot
- **Bot Token**: `8718639508:AAEhujObphEq61fhWBdkehKDrUWdDSgw4K8`
- **Admin Telegram ID**: `8387296012`

## Crypto Payment Addresses
- **BTC**: `bc1q0rjmgvh54gd44d76e2uk7w6lglaft7zaddzx22`
- **LTC**: `ltc1qdf4dy9nsdqd2zn25uf5mdnq2xhnw4ugtcaqg4u`

## URLs
- **Mini App**: https://b4cf57de-bdf3-496a-8f16-0311d8a527a2.preview.emergentagent.com
- **API Health**: https://b4cf57de-bdf3-496a-8f16-0311d8a527a2.preview.emergentagent.com/api/health

## Demo Data
- 3 categories (Électronique, Mode, Digital)
- 6 products seeded with images
- Demo user with ID 8387296012

## Admin Bot Commands
- `/start` - Welcome message with Mini App button
- `/admin` - Admin panel
- `/add_balance <telegram_id> <amount_cents>` - Add balance to user
- `/order_status <order_number> <status>` - Update order status
- `/order_find <order_number>` - Search order
- `/broadcast <message>` - Send message to all users
