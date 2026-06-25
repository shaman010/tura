import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Icon } from '../components/Icon'
import { Img } from '../components/Img'
import { FullscreenProductDetail } from '../components/FullscreenProductDetail'
import { useStore } from '../store/useStore'
import { useRuntimeCatalog } from '../lib/cms'
import { tenge } from '../lib/format'
import { STYLE_LABELS } from '../lib/recommendations'
import { track } from '../lib/analytics'
import type { Product } from '../types'

const DEFAULT_CHIP = 'Все'

type Mode = 'Вдохновение' | 'Каталог'

export function Search() {
  const openStore = useStore((s) => s.openStore)
  const { products, sellers, categories } = useRuntimeCatalog()
  const [query, setQuery] = useState('')
  const [chip, setChip] = useState(DEFAULT_CHIP)
  const [mode, setMode] = useState<Mode>('Вдохновение')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    track('search_opened')
  }, [])

  useEffect(() => {
    const q = query.trim()
    if (!q) return
    const t = window.setTimeout(() => track('search_query', { query: q }), 500)
    return () => window.clearTimeout(t)
  }, [query])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => {
      const byChip =
        chip === DEFAULT_CHIP
          ? true
          : chip === 'Sale'
            ? !!p.oldPrice
            : String(p.category) === chip
      const byQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      return byChip && byQuery
    })
  }, [products, query, chip])

  // Вдохновение — перемешиваем по стилям для разнообразия идей
  const inspiration = useMemo(() => {
    const groups = new Map<string, Product[]>()
    results.forEach((p) => {
      const k = p.styleTags[0] ?? 'misc'
      if (!groups.has(k)) groups.set(k, [])
      groups.get(k)!.push(p)
    })
    const arr: Product[] = []
    let idx = 0
    let added = true
    while (added) {
      added = false
      for (const g of groups.values()) {
        if (g[idx]) {
          arr.push(g[idx])
          added = true
        }
      }
      idx++
    }
    return arr
  }, [results])

  // Каталог — товары продавцов, сгруппированы по бренду
  const catalog = useMemo(
    () => [...results].sort((a, b) => a.brand.localeCompare(b.brand) || a.price - b.price),
    [results],
  )

  const cols: Product[][] = [[], []]
  inspiration.forEach((p, i) => cols[i % 2].push(p))
  const heights = ['h-56', 'h-72', 'h-64', 'h-80']

  const chips = [DEFAULT_CHIP, ...categories.map((category) => category.name), 'Sale']

  const selectChip = (c: string) => {
    setChip(c)
    track('category_selected', { category: c })
  }
  const switchMode = (m: Mode) => {
    setMode(m)
    track('price_toggle_changed', { mode: m })
  }
  const open = (p: Product) => {
    setSelectedId(p.id)
    track('search_card_tapped', { productId: p.id })
    track('search_card_opened', { productId: p.id })
  }

  return (
    <div className="relative h-full w-full max-w-[480px] overflow-hidden bg-base text-ink">
      <div className="space-y-3 px-4 pb-2" style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 16px)' }}>
        <div className="flex h-12 items-center gap-2 rounded-2xl bg-surface px-4">
          <Icon name="search" size={20} className="text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Найти образ, товар или стиль"
            className="h-full flex-1 bg-transparent text-[15px] outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} aria-label="Очистить" className="text-muted">
              <Icon name="close" size={18} />
            </button>
          )}
        </div>

        {/* режим: Вдохновение = идеи по стилям, Каталог = товары продавцов */}
        <div className="flex rounded-2xl bg-surface p-1">
          {(['Вдохновение', 'Каталог'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-bold transition ${
                mode === m ? 'bg-ink text-card shadow-soft' : 'text-muted'
              }`}
            >
              <Icon name={m === 'Вдохновение' ? 'sparkles' : 'store'} size={15} />
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* бренды-магазины (видны в каталоге) */}
      {mode === 'Каталог' && (
        <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1">
          {sellers.map((b) => (
            <button key={b.id} onClick={() => openStore(b.name)} className="flex flex-shrink-0 flex-col items-center gap-1.5 active:scale-95">
              <span className="relative h-16 w-16 overflow-hidden rounded-2xl border border-ink/10">
                <Img src={b.coverUrl} alt={b.name} fallbackLabel={b.name} className="h-full w-full object-cover" />
                <span className="absolute inset-0 bg-black/30" />
              </span>
              <span className="text-[11px] font-bold">{b.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* chips */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
        {chips.map((c) => (
          <button
            key={c}
            onClick={() => selectChip(c)}
            className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
              chip === c ? 'bg-magenta text-ink shadow-glow' : 'bg-surface text-ink'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className={`no-scrollbar overflow-y-auto px-3 pb-28 ${mode === 'Каталог' ? 'h-[calc(100%-220px)]' : 'h-[calc(100%-156px)]'}`}>
        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-24 text-center text-muted">
            <Icon name="search" size={40} />
            <p className="font-semibold">Каталог пока пуст</p>
            <p className="text-sm">Добавьте товары через админку</p>
          </div>
        ) : mode === 'Вдохновение' ? (
          /* ====== ВДОХНОВЕНИЕ — идеи из разных стилей (moodboard) ====== */
          <div className="flex gap-3">
            {cols.map((col, ci) => (
              <div key={ci} className="flex flex-1 flex-col gap-3">
                {col.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => open(p)}
                    className="group relative overflow-hidden rounded-3xl text-left active:scale-[0.98]"
                    style={{ transition: 'transform 0.2s' }}
                  >
                    <motion.div layoutId={`pin-${p.id}`} className={`overflow-hidden rounded-3xl ${heights[(ci + i) % heights.length]}`}>
                      <Img src={p.images[0]} alt={p.title} fallbackLabel={p.title} className="h-full w-full object-cover" />
                    </motion.div>
                    <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-t from-black/55 to-transparent opacity-90" />
                    {p.styleTags[0] && (
                      <span className="absolute left-2 top-2 rounded-full bg-ink/15 px-2.5 py-1 text-[11px] font-bold backdrop-blur-md">
                        {STYLE_LABELS[p.styleTags[0]]}
                      </span>
                    )}
                    <div className="absolute bottom-2 left-3 right-3">
                      <div className="truncate text-sm font-bold">{p.title}</div>
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        ) : (
          /* ====== КАТАЛОГ — товары продавцов, блочные карточки ====== */
          <div className="grid grid-cols-2 gap-3">
            {catalog.map((p) => (
              <button
                key={p.id}
                onClick={() => open(p)}
                className="overflow-hidden rounded-3xl border border-ink/10 bg-ink/[0.04] text-left active:scale-[0.98]"
              >
                <div className="relative">
                  <motion.div layoutId={`pin-${p.id}`} className="aspect-[3/4] w-full overflow-hidden">
                    <Img src={p.images[0]} alt={p.title} fallbackLabel={p.title} className="h-full w-full object-cover" />
                  </motion.div>
                  {p.oldPrice && (
                    <span className="absolute left-2 top-2 rounded-full bg-magenta px-2 py-0.5 text-[11px] font-bold text-ink">SALE</span>
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-magenta">
                    <Icon name="store" size={11} /> {p.brand}
                  </div>
                  <div className="mt-0.5 truncate text-sm font-bold">{p.title}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm font-extrabold tabular">{tenge(p.price)}</span>
                    {p.oldPrice && <span className="text-xs text-muted line-through tabular">{tenge(p.oldPrice)}</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* full-screen detail (Search остаётся смонтированным → scroll сохраняется) */}
      <AnimatePresence>
        {selectedId && (
          <FullscreenProductDetail
            key={selectedId}
            productId={selectedId}
            onBack={() => setSelectedId(null)}
            onSelect={(id) => setSelectedId(id)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
