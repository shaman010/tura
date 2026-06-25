import type { FeedItem, Product, StylePreferences, StyleTag } from '../types'

export const STYLE_TAGS: StyleTag[] = [
  'minimal',
  'streetwear',
  'casual',
  'classic',
  'sport',
  'korean',
  'luxury',
  'oversize',
  'feminine',
  'office',
]

export const STYLE_LABELS: Record<StyleTag, string> = {
  minimal: 'Minimal',
  streetwear: 'Streetwear',
  casual: 'Casual',
  classic: 'Classic',
  sport: 'Sport',
  korean: 'Korean style',
  luxury: 'Luxury',
  oversize: 'Oversize',
  feminine: 'Feminine',
  office: 'Office',
}

// Веса сигналов из ТЗ §11
export const WEIGHTS = {
  like: 2,
  dislike: -2,
  save: 4,
  cart: 5,
  purchase: 8,
} as const

export function emptyPreferences(): StylePreferences {
  return STYLE_TAGS.reduce((acc, t) => {
    acc[t] = 0
    return acc
  }, {} as StylePreferences)
}

/** Применяет сигнал к предпочтениям: повышает/снижает веса styleTags товара. */
export function applySignal(
  prefs: StylePreferences,
  styleTags: StyleTag[],
  delta: number,
): StylePreferences {
  const next = { ...prefs }
  for (const tag of styleTags) {
    next[tag] = clamp((next[tag] ?? 0) + delta, -20, 60)
  }
  return next
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

/** Совпадение товара с предпочтениями пользователя — сумма весов его styleTags. */
export function matchScore(prefs: StylePreferences, p: Product): number {
  return p.styleTags.reduce((sum, t) => sum + (prefs[t] ?? 0), 0)
}

/**
 * Сортирует ленту по совпадению styleTags товара с предпочтениями.
 * Скрытые (disliked) уходят в конец. Добавлен элемент случайности (jitter),
 * чтобы лента не становилась однообразной при каждом входе.
 */
export function rankFeed(
  feed: FeedItem[],
  productOf: (id: string) => Product | undefined,
  prefs: StylePreferences,
  dislikedProductIds: string[],
  randomness = 5,
): FeedItem[] {
  const disliked = new Set(dislikedProductIds)
  const scored = feed.map((item) => {
    const p = productOf(item.productId)
    const base = p ? matchScore(prefs, p) : 0
    const jitter = (Math.random() - 0.5) * 2 * randomness
    return { item, demoted: disliked.has(item.productId), score: base + jitter }
  })
  scored.sort((a, b) => {
    if (a.demoted !== b.demoted) return a.demoted ? 1 : -1 // disliked в конец
    return b.score - a.score
  })
  return scored.map((s) => s.item)
}

/** Нормализованные проценты вкуса для экрана «Предпочтения». */
export function preferencePercents(prefs: StylePreferences) {
  const max = Math.max(10, ...STYLE_TAGS.map((t) => prefs[t] ?? 0))
  return STYLE_TAGS.map((tag) => ({
    tag,
    label: STYLE_LABELS[tag],
    percent: Math.round(clamp(((prefs[tag] ?? 0) / max) * 100, 0, 100)),
  })).sort((a, b) => b.percent - a.percent)
}

/** Рекомендованный размер на основе данных тела пользователя. */
export function recommendedSize(
  sizes: { height?: string; fit?: string } | undefined,
  available: string[],
): string | null {
  if (!sizes?.height) return null
  const numeric = available.every((s) => /^\d+$/.test(s))
  if (numeric) {
    // обувь — возвращаем средний доступный размер
    return available[Math.floor(available.length / 2)] ?? null
  }
  const h = parseInt(sizes.height, 10)
  if (Number.isNaN(h)) return null
  let base: string
  if (h < 160) base = 'XS'
  else if (h < 168) base = 'S'
  else if (h < 176) base = 'M'
  else if (h < 184) base = 'L'
  else base = 'XL'
  // поправка на посадку
  const order = ['XS', 'S', 'M', 'L', 'XL']
  let idx = order.indexOf(base)
  if (sizes.fit === 'oversize') idx = Math.min(order.length - 1, idx + 1)
  if (sizes.fit === 'slim') idx = Math.max(0, idx - 1)
  const target = order[idx]
  return available.includes(target) ? target : available[0] ?? null
}
