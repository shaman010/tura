# Swipd — деплой и подключение бэкенда (Фаза 0–1)

## A. Постоянная ссылка (вместо туннеля) — 10 минут

### Вариант 1: Cloudflare Pages (рекомендую, KZ-латентность хорошая)
1. Залей проект на GitHub (могу помочь).
2. Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
3. Build settings:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Build output: `dist`
4. Add environment variables (см. ниже) → Deploy.
5. Получишь домен вида `swipd.pages.dev` (можно привязать свой).

### Вариант 2: Vercel
1. GitHub → vercel.com → Import Project.
2. Vite определяется автоматически (`npm run build`, output `dist`).
3. Добавь env-переменные → Deploy → `swipd.vercel.app`.

### Вариант 2.5: Netlify Drop (без Git, на показ)
- Перетащи папку `dist` на https://app.netlify.com/drop → мгновенный публичный URL.

> Для SPA включи fallback на `index.html` (Cloudflare Pages и Vercel делают это сами для Vite).

---

## B. Supabase (БД + Auth + Storage) — 20 минут

1. https://supabase.com → New project (регион: ближайший, напр. **eu-central / Frankfurt**).
2. **SQL Editor** → вставь `supabase/schema.sql` целиком → **Run**.
3. **Authentication → Providers**: включи Email (Magic Link/OTP) и/или Phone; по желанию Google.
4. **Project Settings → API**: скопируй `Project URL` и `anon public` key.
5. Положи их в env (локально `.env`, в Cloudflare/Vercel — в переменные окружения):

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

> `anon` ключ — публичный, его можно держать на фронте: доступ ограничен RLS.
> **Service role** ключ — только на сервере (Edge Functions), никогда на фронт.

---

## C. Видео (Cloudflare Stream) — когда дойдём до загрузки

1. Cloudflare Dashboard → **Stream** → включить.
2. Загрузка из браузера: Edge Function выдаёт **Direct Creator Upload URL**, браузер льёт файл
   напрямую в Stream (минуя наш сервер).
3. Stream возвращает `uid` + `thumbnail` → пишем в `product_media (kind='video', stream_uid, poster_url)`.
4. На фронте плеер играет HLS: `https://customer-<code>.cloudflarestream.com/<uid>/manifest/video.m3u8`.

Дешёвая альтернатива: **bunny.net Stream** (часто выгоднее по трафику в регионе).

---

## D. Что подключаем в коде (по шагам)

1. Установить клиент: `npm i @supabase/supabase-js` (уже добавлено: `src/lib/supabase.ts`).
2. Пока в env нет ключей — приложение работает на статике (`src/data/*`), ничего не ломается.
3. Появятся ключи → переключаем чтение каталога/ленты на Supabase через дата-адаптер
   (следующий шаг, делаю по готовности БД).

---

## E. Перед публичным запуском (чек-лист)
- [ ] env-переменные заданы в хостинге (не в коде).
- [ ] RLS включён (схема это делает) — проверить, что чужие данные не читаются.
- [ ] Бэкапы БД (Supabase → Database → Backups).
- [ ] Sentry DSN добавлен, PostHog ключ добавлен.
- [ ] Сжать тяжёлые видео (Stream сделает сам при загрузке через него).
- [ ] Свой домен + HTTPS.
</content>
