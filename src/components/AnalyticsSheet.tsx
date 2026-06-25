import { useEffect, useMemo, useState } from 'react'
import { BottomSheet } from './BottomSheet'
import { Icon } from './Icon'
import { getAnalytics, clearAnalytics, type AnalyticsEntry, type AnalyticsEvent } from '../lib/analytics'

const LABELS: Partial<Record<AnalyticsEvent, string>> = {
  onboarding_started: 'Онбординг начат',
  onboarding_completed: 'Онбординг пройден',
  onboarding_skipped: 'Онбординг пропущен',
  feed_view: 'Просмотр в ленте',
  swipe_up: 'Свайп вверх',
  swipe_down: 'Свайп вниз',
  swipe_right: 'Лайк (вправо)',
  swipe_left: 'Дизлайк (влево)',
  product_opened: 'Открыт товар',
  product_saved: 'Сохранено',
  add_to_cart: 'В выбранное',
  buy_now_clicked: 'Оставить заявку',
  lead_form_opened: 'Форма заявки',
  lead_submitted: 'Заявка отправлена',
  seller_page_opened: 'Страница продавца',
  search_query: 'Поиск',
  category_selected: 'Категория',
  price_toggle_changed: 'Режим цены',
  search_card_tapped: 'Тап по карточке',
  cart_select_mode_enabled: 'Режим выбора',
  cart_item_selected: 'Выбор товара',
  checkout_started: 'Заявка начата',
  order_completed: 'Заявка отправлена',
}

function ago(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return `${s} с назад`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} мин назад`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} ч назад`
  return `${Math.floor(h / 24)} дн назад`
}

function propsSummary(props?: Record<string, unknown>) {
  if (!props) return ''
  return Object.entries(props)
    .map(([k, v]) => `${k}: ${v}`)
    .join(' · ')
}

interface Props {
  open: boolean
  onClose: () => void
}

export function AnalyticsSheet({ open, onClose }: Props) {
  const [events, setEvents] = useState<AnalyticsEntry[]>([])

  const refresh = () => setEvents(getAnalytics())
  useEffect(() => {
    if (open) refresh()
  }, [open])

  const counts = useMemo(() => {
    const m = new Map<AnalyticsEvent, number>()
    for (const e of events) m.set(e.event, (m.get(e.event) ?? 0) + 1)
    return m
  }, [events])

  const funnel = [
    { key: 'feed_view' as const, label: 'Просмотры', icon: 'spark' as const, accent: 'text-electric' },
    { key: 'swipe_right' as const, label: 'Лайки', icon: 'heartFill' as const, accent: 'text-magenta' },
    { key: 'add_to_cart' as const, label: 'В выбранное', icon: 'bag' as const, accent: 'text-violet' },
    { key: 'order_completed' as const, label: 'Заявки', icon: 'box' as const, accent: 'text-emerald-600' },
  ]

  const recent = [...events].reverse().slice(0, 80)

  return (
    <BottomSheet open={open} onClose={onClose} full label="Аналитика">
      <div className="flex items-center justify-between px-5 pb-3 pt-3">
        <div>
          <h3 className="text-lg font-bold">Аналитика</h3>
          <p className="text-xs text-muted">{events.length} событий · локально</p>
        </div>
        <button
          onClick={() => {
            clearAnalytics()
            refresh()
          }}
          className="flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs font-bold text-magenta"
        >
          <Icon name="trash" size={15} /> Очистить
        </button>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-10">
        {/* funnel */}
        <div className="grid grid-cols-4 gap-2">
          {funnel.map((f) => (
            <div key={f.key} className="rounded-2xl bg-surface p-3 text-center">
              <Icon name={f.icon} size={18} className={`mx-auto ${f.accent}`} />
              <div className="mt-1 text-lg font-extrabold tabular">{counts.get(f.key) ?? 0}</div>
              <div className="text-[10px] font-semibold text-muted">{f.label}</div>
            </div>
          ))}
        </div>

        {events.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-20 text-center text-muted">
            <Icon name="sparkles" size={36} />
            <p className="font-semibold">Событий пока нет</p>
            <p className="text-sm">Полистай ленту, лайкни, добавь в корзину — события появятся здесь.</p>
          </div>
        ) : (
          <>
            {/* breakdown by event */}
            <h4 className="mb-2 mt-6 text-sm font-bold">Все события</h4>
            <div className="flex flex-wrap gap-2">
              {[...counts.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([ev, n]) => (
                  <span key={ev} className="flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs font-semibold">
                    {LABELS[ev]}
                    <span className="rounded-full bg-magenta px-1.5 text-[11px] font-bold text-ink tabular">{n}</span>
                  </span>
                ))}
            </div>

            {/* timeline */}
            <h4 className="mb-2 mt-6 text-sm font-bold">Лента событий</h4>
            <div className="space-y-1.5">
              {recent.map((e, i) => (
                <div key={i} className="flex items-center gap-3 rounded-2xl bg-surface px-3.5 py-2.5">
                  <span className="h-2 w-2 flex-shrink-0 rounded-full bg-magenta" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{LABELS[e.event]}</div>
                    {e.props && <div className="truncate text-xs text-muted">{propsSummary(e.props)}</div>}
                  </div>
                  <span className="flex-shrink-0 text-[11px] text-muted">{ago(e.ts)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  )
}

