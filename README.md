# Nova Telegram Shop Bot

Bot Telegram e-commerce production-ready (base solide) avec Node.js + TypeScript + grammY + Prisma/PostgreSQL + Redis + API admin.

## 1) Analyse UX des références (sans copie)

### Structure observée
- Navigation principale persistante en 5 entrées: accueil, paiement/dépôt, boutique, support, réglages.
- Écrans "cartes" avec sections hiérarchisées (solde, produits, annonces, tickets).
- Parcours boutique en 3 niveaux: catégorie → liste produit → détail.
- Actions directes et rapides via boutons courts.

### Composants UX utiles à reprendre
- Menu principal compact avec CTA explicites.
- Listes d'objets avec statut visuel (stock, prix, statut commande/ticket).
- Retour arrière clair et omniprésent.
- Erreurs brèves orientées action.

### Ce qui doit être réinventé (pour rester légal/original)
- Branding, palette, wording et assets totalement nouveaux.
- Domaine produit strictement licite (aucun contenu illicite, aucune fraude).
- Architecture backend orientée conformité: logs admin, RBAC, paiement vérifié, confidentialité.

## 2) Spécification fonctionnelle concise

### Côté client
- `/start` + menu inline principal.
- Navigation catalogue: catégories, produits, fiche produit, photos, stock.
- Panier: ajout, incrément/décrément, suppression, total.
- Checkout: création commande + paiement manuel légal (jamais marqué payé sans preuve).
- Historique commandes + statuts (`PENDING`, `PAID`, `PREPARING`, `SHIPPED`, `COMPLETED`, `CANCELED`).
- Support: création ticket + listing tickets.
- FAQ/Aide.

### Côté admin/staff
- Contrôle d'accès via whitelist Telegram IDs et rôles DB (ADMIN/STAFF).
- Commandes bot: voir commandes, recherche commande, changement statut, broadcast (admin only).
- API interne sécurisée (`x-api-key`) pour CRUD catégories/produits, stock, users, commandes.
- Journalisation des actions sensibles dans `admin_logs`.

### Sécurité
- Validation d'inputs via Zod.
- Rate limiting Redis par user/minute.
- Sanitization simple sur texte utilisateur.
- Secrets exclusivement via variables d'environnement.
- Logs structurés (Pino) avec redaction de données sensibles.

## 3) Arborescence

```txt
.
├── src
│   ├── api
│   │   ├── middleware/auth.ts
│   │   ├── routes/admin.ts
│   │   ├── routes/health.ts
│   │   └── app.ts
│   ├── bot
│   │   ├── context.ts
│   │   ├── handlers/admin.ts
│   │   ├── handlers/public.ts
│   │   ├── keyboards/main-menu.ts
│   │   └── middleware/{rate-limit.ts,user.ts}
│   ├── config/env.ts
│   ├── lib/{logger.ts,prisma.ts,redis.ts}
│   ├── services/*.ts
│   ├── validators/common.ts
│   └── index.ts
├── prisma
│   ├── schema.prisma
│   ├── migrations/20260327000000_init/migration.sql
│   └── seed.ts
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── package.json
└── tsconfig.json
```

## 4) Démarrage local

1. Copier l'environnement:
   ```bash
   cp .env.example .env
   ```
2. Lancer les services:
   ```bash
   docker compose up -d postgres redis
   ```
3. Installer dépendances:
   ```bash
   npm install
   ```
4. Générer Prisma Client + appliquer migration + seed:
   ```bash
   npm run prisma:generate
   npx prisma migrate deploy
   npm run prisma:seed
   ```
5. Lancer le bot + API:
   ```bash
   npm run dev
   ```

## 5) Déploiement Docker complet

```bash
docker compose up --build -d
```

## 6) Exemples de commandes Telegram à tester

- `/start`
- `/ticket Livraison | Je souhaite un suivi de ma commande`
- `/admin_orders` (staff/admin)
- `/order_find ORD-12345678` (staff/admin)
- `/order_status <orderId> PAID` (staff/admin)
- `/broadcast Maintenance planifiée demain 22h.` (admin)

## 7) Notes paiement

- Implémentation de base: `PaymentMethod.MANUAL`.
- Le flux est prêt pour extension Stripe/PSP via la table `payments` et les services `order/payment`.
- Règle de conformité: ne jamais basculer en `CONFIRMED/PAID` sans preuve de confirmation réelle.
