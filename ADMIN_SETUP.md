# Swipd Admin Setup

## Cloudflare status

Admin now uses Vercel API `/api/cms` for Cloudflare D1. If Cloudflare env variables are missing, the app falls back to localStorage so the site does not break.

Apply both D1 migrations:

```bash
wrangler d1 execute tura-db --file=./migrations/0001_initial_schema.sql --remote
wrangler d1 execute tura-db --file=./migrations/0002_seller_first_social_commerce.sql --remote
```

`0002_seller_first_social_commerce.sql` adds Seller Studio, Inspiration posts, tagged products, follows/saves, and analytics events.

Add these variables in Vercel Project Settings -> Environments -> Production:

```text
ADMIN_PASSWORD=your-admin-password
CLOUDFLARE_ACCOUNT_ID=f03e97a0947e37d72134e0e141809c63
CLOUDFLARE_D1_DATABASE_ID=7b493aaf-2b24-4c9a-a9f2-fa40d707f977
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
R2_BUCKET_NAME=tura-media
R2_PUBLIC_BASE_URL=https://pub-8d6870a83bda4583adf06997fffda81b.r2.dev
```

For direct file upload from admin to R2, also add:

```text
R2_ACCOUNT_ID=f03e97a0947e37d72134e0e141809c63
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
```

Do not commit real tokens, passwords, or R2 secret keys to GitHub.

## Текущий MVP-режим

Админка уже доступна по адресу:

```text
/admin
```

Контент хранится в `localStorage` через `CmsDataService`. Это временный слой, сделанный так, чтобы позже заменить storage на Cloudflare Worker API без переписывания UI.

## Vercel env variables

Добавьте в Vercel Project Settings -> Environment Variables:

```text
ADMIN_PASSWORD=your-strong-password
TELEGRAM_BOT_TOKEN=
TELEGRAM_ADMIN_CHAT_ID=
```

Cloudflare R2 variables для будущего upload endpoint:

```text
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_BASE_URL=
```

Важно: эти ключи нельзя хранить во frontend-коде.

## Cloudflare D1

1. Создайте D1 database в Cloudflare Dashboard.
2. Скопируйте database id.
3. Примените migration:

```bash
wrangler d1 execute swipd-db --file=./migrations/0001_initial_schema.sql
```

4. В Worker добавьте binding:

```toml
[[d1_databases]]
binding = "DB"
database_name = "swipd-db"
database_id = "..."
```

## Cloudflare R2

1. Создайте bucket, например `swipd-media`.
2. Настройте public domain или custom domain.
3. Сохраните public base URL в `R2_PUBLIC_BASE_URL`.
4. Upload endpoint должен принимать только admin session/token.

Поддерживаемые форматы:

```text
jpg, jpeg, png, webp, mp4, mov
```

Рекомендуемые лимиты:

```text
image max 5MB
video max 100MB
```

## Как проверить seller-first flow

1. Откройте `/admin`.
2. Войдите с `ADMIN_PASSWORD`.
3. Создайте продавца и заполните WhatsApp.
4. Создайте категорию.
5. Создайте товар и загрузите обложку прямо из формы товара.
6. Откройте раздел `Вдохновение`, создайте образ, загрузите фото/видео и отметьте товары.
7. Поставьте post status `published`, `Публиковать в Discovery`, moderation `approved`.
8. Откройте `/`, `/search`, `/seller/:slug`, `/post/:id`, `/product/:id`.
9. На товаре нажмите `Написать в WhatsApp`: должен открыться чат продавца с готовым сообщением.

Продавец может делать то же самое из `/studio`: добавить товар, загрузить медиа, создать образ и отметить свои товары.

## Future Worker API

Public API:

```text
GET /api/products
GET /api/products/:id
GET /api/feed
GET /api/sellers
GET /api/sellers/:slug
GET /api/categories
POST /api/leads
```

Admin API:

```text
POST /api/admin/login
GET/POST/PUT/DELETE /api/admin/products
GET/POST/PUT/DELETE /api/admin/feed-items
GET/POST/PUT/DELETE /api/admin/sellers
GET/POST/PUT/DELETE /api/admin/categories
GET/PUT /api/admin/leads
POST /api/admin/upload
```

Frontend сейчас использует service layer, поэтому замена localStorage на Worker API должна быть внутри `src/lib/cms.ts`.
