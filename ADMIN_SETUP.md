# Swipd Admin Setup

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

## Как добавить первый товар

1. Откройте `/admin`.
2. Войдите с `ADMIN_PASSWORD`.
3. Создайте продавца.
4. Создайте категорию.
5. Создайте товар:
   - seller
   - category
   - title
   - price
   - cover image URL из R2/CDN
   - status `published`
   - in stock `true`
6. Создайте feed item и привяжите его к товару.
7. Откройте главную страницу: item появится в Discovery, товар появится в Search.

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
