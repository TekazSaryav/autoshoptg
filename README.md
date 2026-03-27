# Patek Shop - Bot Telegram E-commerce

Bot Telegram complet pour une boutique en ligne avec panel d'administration web.

## Fonctionnalités

### Bot Telegram (Client)
- `/start` - Message d'accueil et menu principal
- Navigation par catégories et produits
- Gestion du panier (ajouter, modifier, supprimer)
- Checkout avec paiement crypto (BTC/LTC)
- Historique des commandes
- Système de tickets support
- FAQ et aide

### Bot Telegram (Admin)
- `/admin` - Panel admin
- `/order_status <ref> <status>` - Changer le statut d'une commande
- `/order_find <ref>` - Rechercher une commande
- `/confirm_payment <order_number> [tx_hash]` - Confirmer un paiement
- `/broadcast <message>` - Envoyer un message à tous les utilisateurs

### Panel Web Admin
- Dashboard avec statistiques
- CRUD Catégories
- CRUD Produits
- Gestion des commandes
- Gestion des utilisateurs et rôles
- Tickets support

## Stack Technique

- **Bot**: Python + python-telegram-bot
- **Backend API**: FastAPI
- **Frontend Admin**: React + TailwindCSS
- **Base de données**: MongoDB

## Installation

### 1. Configuration

```bash
# Copier le fichier de configuration
cp backend/.env.example backend/.env

# Éditer les variables
nano backend/.env
```

### 2. Installation des dépendances

```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
yarn install
```

### 3. Lancement

```bash
# Démarrer l'API
cd backend && python server.py

# Démarrer le bot (dans un autre terminal)
cd backend && python bot.py

# Démarrer le frontend
cd frontend && yarn start
```

## Structure du Projet

```
/app
├── backend/
│   ├── .env              # Configuration
│   ├── .env.example      # Template de configuration
│   ├── requirements.txt  # Dépendances Python
│   ├── server.py         # API FastAPI
│   ├── bot.py            # Bot Telegram
│   ├── models.py         # Modèles Pydantic
│   └── database.py       # Services MongoDB
├── frontend/
│   ├── package.json
│   ├── src/
│   │   ├── App.js        # Application React
│   │   └── index.css     # Styles
│   └── public/
└── README.md
```

## Configuration

### Variables d'environnement

| Variable | Description |
|----------|-------------|
| `MONGO_URL` | URL de connexion MongoDB |
| `DB_NAME` | Nom de la base de données |
| `TELEGRAM_BOT_TOKEN` | Token du bot (via @BotFather) |
| `ADMIN_TELEGRAM_IDS` | IDs Telegram des admins (séparés par virgule) |
| `STAFF_TELEGRAM_IDS` | IDs Telegram du staff |
| `BTC_ADDRESS` | Adresse Bitcoin pour paiements |
| `LTC_ADDRESS` | Adresse Litecoin pour paiements |
| `INTERNAL_API_KEY` | Clé API pour le panel admin |
| `RATE_LIMIT_PER_MINUTE` | Limite de requêtes par minute |

## Base de données

### Collections MongoDB

- `users` - Utilisateurs
- `categories` - Catégories de produits
- `products` - Produits
- `carts` - Paniers
- `orders` - Commandes
- `payments` - Paiements
- `support_tickets` - Tickets support
- `admin_logs` - Logs d'actions admin
- `settings` - Paramètres

## Commandes de test

### Bot Telegram
1. Ouvrir le bot dans Telegram
2. `/start` - Affiche le menu
3. Parcourir Boutique > Catégorie > Produit
4. Ajouter au panier
5. Panier > Passer commande
6. `/ticket Sujet | Message` - Créer un ticket support

### Admin
1. `/admin` - Affiche le menu admin
2. `/order_status PS-XXXXXXXX paid` - Marquer comme payé
3. `/confirm_payment PS-XXXXXXXX tx_hash` - Confirmer paiement

## Sécurité

- Authentification admin via whitelist Telegram ID
- Rate limiting sur le bot
- Validation stricte des entrées (Pydantic)
- Clé API pour les endpoints admin
- Logs des actions administratives

## Paiements

Le système utilise un mode de paiement manuel crypto :
1. Le client crée une commande
2. Les adresses crypto s'affichent (BTC/LTC)
3. Le client effectue le paiement
4. Le client envoie une preuve via le support
5. Un admin confirme le paiement avec `/confirm_payment`

## License

MIT
