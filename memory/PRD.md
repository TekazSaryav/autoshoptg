# Patek Shop - PRD (Product Requirements Document)

## Original Problem Statement
Créer un bot Telegram de boutique en ligne complet sous forme de Mini App (WebApp), avec le même style que les captures d'écran fournies (fond sombre, accents rouges, navigation en bas). Le bot doit permettre de parcourir un catalogue, gérer un panier, payer avec un portefeuille interne rechargeable en crypto.

## User Choices
- **Interface**: Telegram Mini App (WebApp) - pas de boutons inline
- **Design**: Fond sombre (#0d0d12) avec accents rouges (#dc2626)
- **Navigation**: Bottom bar (Accueil, Dépôt, Boutique, Support, Réglages)
- **Payment**: Système de portefeuille interne avec recharge crypto (BTC/LTC)
- **Admin ID**: 8387296012

## Architecture

### Backend (Python/FastAPI)
- `server.py` - FastAPI REST API avec endpoints WebApp et Admin
- `bot.py` - Telegram bot avec bouton Mini App
- `database.py` - MongoDB services avec wallet
- `models.py` - Pydantic models

### Frontend (React - Mini App)
- Design sombre avec accents rouges
- Navigation bottom bar
- Pages: Home, Deposit, Shop, Support, Settings
- Modals: Product detail, Cart, New ticket

### Database (MongoDB)
Collections: users (avec balance_cents), categories, products, carts, orders, payments, support_tickets, admin_logs, settings

## Core Requirements (Static)

### Mini App Features
- [x] Page Accueil avec solde et aperçu catégories
- [x] Page Dépôt avec adresses crypto BTC/LTC
- [x] Page Boutique avec catégories
- [x] Page catégorie avec produits et images
- [x] Modal fiche produit avec ajout panier
- [x] Système de panier avec FAB
- [x] Checkout avec solde wallet
- [x] Page Support avec tickets
- [x] Page Réglages avec profil et commandes

### Bot Features
- [x] /start avec bouton Mini App
- [x] /admin pour panel admin
- [x] /add_balance pour créditer utilisateurs
- [x] /order_status pour changer statut
- [x] /broadcast pour messages globaux

### Wallet System
- [x] Balance utilisateur en cents EUR
- [x] Affichage des adresses crypto pour dépôt
- [x] Paiement avec déduction du solde
- [x] Admin peut ajouter du solde

## What's Been Implemented
**Date: 2026-04-02**

1. ✅ Telegram Mini App complète avec design sombre/rouge
2. ✅ Navigation bottom bar 5 onglets
3. ✅ Système de portefeuille interne
4. ✅ Catalogue produits avec images
5. ✅ Panier avec FAB flottant
6. ✅ Checkout avec wallet balance
7. ✅ Page dépôt crypto (BTC/LTC)
8. ✅ Support tickets
9. ✅ Bot Telegram avec bouton Mini App
10. ✅ Commandes admin via bot

## Test Results
- Backend WebApp APIs: 100% (6/6 tests)
- Frontend Mini App: 95% (minor modal issue)

## Prioritized Backlog

### P0 (Critical) - DONE

### P1 (High Priority)
- [ ] Lancer le bot Telegram en production
- [ ] Ajouter notification push après paiement confirmé
- [ ] Implémenter historique des dépôts

### P2 (Medium Priority)
- [ ] Ajouter QR codes pour adresses crypto
- [ ] Implémenter recherche produits
- [ ] Ajouter filtres par prix

### P3 (Nice to Have)
- [ ] Multi-langue
- [ ] Codes promo
- [ ] Système de fidélité

## Next Tasks
1. Lancer `python bot.py` pour activer le bot Telegram
2. Configurer le WebApp URL dans BotFather (@BotFather > /mybots > Bot Settings > Menu Button)
3. Tester le flow complet d'achat dans Telegram
