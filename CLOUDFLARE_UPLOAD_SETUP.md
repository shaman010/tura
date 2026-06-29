# Cloudflare Upload Setup

This version of the admin panel uploads media directly to Cloudflare R2.

## Vercel Environment Variables

Add these variables in Vercel Project Settings -> Environments -> Production:

```text
ADMIN_PASSWORD=your-admin-password
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
CLOUDFLARE_D1_DATABASE_ID=your-d1-database-id
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token

R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=tura-media
R2_PUBLIC_BASE_URL=https://pub-8d6870a83bda4583adf06997fffda81b.r2.dev
```

Do not commit real passwords, API tokens, or R2 secret keys to GitHub.

## R2 CORS

For direct browser upload, allow the Vercel domain in R2 CORS:

```json
[
  {
    "AllowedOrigins": ["https://tura-one.vercel.app"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

## Admin Flow

1. Open `/admin`.
2. Go to `Медиа`.
3. Choose a file from your computer.
4. Click `Загрузить в Cloudflare`.
5. The URL is saved to the media library and copied to clipboard.

Product and feed forms also have direct upload blocks:

```text
Товары -> Обложка товара / Видео товара / Галерея фото
Контент / Лента -> Медиа для ленты
```
