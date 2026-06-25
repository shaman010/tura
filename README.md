# Swipd — маркетплейс нового поколения (MVP)

> **Свайпай. Сохраняй. Покупай. Без переписок.**

TikTok-лента товаров + Tinder-свайпы предпочтений + быстрый путь к покупке без переписки с продавцом. Mobile-first PWA.

## Стек

- **React 18 + TypeScript + Vite**
- **Tailwind CSS** (дизайн-токены: magenta `#FF0A78`, electric `#4F7DFF`, violet `#8B5CFF`)
- **Framer Motion** — свайпы, переходы, bottom-sheets, fly-to-cart
- **Zustand** + `persist` — всё состояние в `localStorage`
- Шрифты: **Manrope** (body) + **Syne** (display)

## Запуск

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # прод-сборка в dist/ (tsc --noEmit + vite build)
npm run preview  # предпросмотр прод-сборки
```

> Node ставился как portable-сборка (`~/node-portable`) и добавлен в PATH — в новом терминале `node`/`npm` доступны напрямую.

## Что реализовано (по ТЗ)

| Раздел | Экран | Статус |
|---|---|---|
| §4 | Onboarding (Welcome → Стили → Размеры → Финал) | ✅ |
| §5 | Discovery — вертикальная лента, свайпы L/R/U/D, tinder-кнопки, мини-карточка, режим интриги с ценой, отзывы-комментарии | ✅ |
| §6 | Product Detail — галерея, цвета, размеры, авто-рекомендация размера, отзови, доставка/возврат | ✅ |
| §7 | Search — masonry-grid, chips, toggle «показывать цены», peek-sheet | ✅ |
| §8 | Cart — режим выбора как в галерее iPhone, action bar | ✅ |
| §8 | Checkout — пошаговый (Контакты → Доставка → Оплата → Готово) | ✅ |
| §9 | Account — статистика, избранное, размеры, адреса, предпочтения, заказы, настройки | ✅ |
| §11 | Алгоритм рекомендаций (like +2 / save +4 / cart +5 / purchase +8 / dislike −2) | ✅ |
| §12 | Анимации: свайпы, like/dislike-burst, fly-to-cart, bottom-sheets, nav-pill | ✅ |
| §15 | Floating glass bottom-nav, safe-area, blur | ✅ |

## Структура

```
src/
├── data/         products.ts, feed.ts   — мок-база
├── lib/          recommendations.ts (алгоритм), format.ts
├── store/        useStore.ts            — Zustand + persist (источник правды)
├── components/   Icon, Img (gradient-fallback), BottomNav, BottomSheet,
│                 ReviewsSheet, SizeFinder, ProductDetail, Overlays
├── screens/      Onboarding, Discovery, Search, Cart, Checkout, Account
└── App.tsx       онбординг-гейт + табы + оверлеи
```

## Telegram-уведомления о заказах

Новый заказ автоматически уходит продавцу в Telegram (без бэкенда — прямой вызов Bot API из браузера).

**Настройка:** Профиль → Настройки → **Кабинет продавца** → баннер **«Заказы в Telegram»**.

1. В Telegram открой **@BotFather** → `/newbot` → скопируй **токен**.
2. Напиши своему боту `/start`.
3. Вставь токен → **«Определить chat_id»** → **«Сохранить и отправить тест»**.

После этого каждый заказ (через checkout или кнопкой «тестовый заказ») приходит в чат с ботом.

> ⚠️ Токен хранится в `localStorage` и виден в трафике фронтенда — ок для демо/одного продавца. Для публичного прода вынеси отправку на бэкенд (`src/lib/telegram.ts` → серверный эндпоинт), чтобы не раскрывать токен. Код интеграции изолирован в `src/lib/telegram.ts`.

## Заметки

- **Изображения** — Unsplash (фэшн). При офлайне/битой ссылке `Img` показывает брендовый градиент с подписью — сломанных картинок в ленте не будет.
- **Сброс демо**: Account → Настройки → «Сбросить всё».
- PWA-манифест подключён (`public/manifest.webmanifest`) — можно «установить на экран».
