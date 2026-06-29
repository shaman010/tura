import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Icon } from '../components/Icon'
import { Img } from '../components/Img'
import { FullscreenProductDetail } from '../components/FullscreenProductDetail'
import { useRuntimeCatalog } from '../lib/cms'
import { tenge } from '../lib/format'
import { track } from '../lib/analytics'
import type { Product } from '../types'

type Mode = 'products' | 'inspiration'
const ALL = 'Все'
const STYLE_OPTIONS = ['casual', 'classic', 'office', 'streetwear', 'minimal', 'romantic', 'sport', 'luxury']

export function Search() {
  const { products, inspirationPosts, categories } = useRuntimeCatalog()
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<Mode>('products')
  const [category, setCategory] = useState(ALL)
  const [style, setStyle] = useState(ALL)
  const [price, setPrice] = useState(ALL)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    track('search_opened')
  }, [])

  const productResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((product) => {
      const byQuery = !q || product.title.toLowerCase().includes(q) || product.sellerName.toLowerCase().includes(q) || product.tags.some((tag) => tag.toLowerCase().includes(q))
      const byCategory = category === ALL || String(product.category) === category
      const byStyle = style === ALL || product.styleTags.includes(style as any)
      const byPrice = price === ALL || (price === 'до 20k' ? product.price <= 20000 : price === '20-50k' ? product.price > 20000 && product.price <= 50000 : product.price > 50000)
      return byQuery && byCategory && byStyle && byPrice
    })
  }, [category, price, products, query, style])

  const postResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    return inspirationPosts.filter((post) => {
      const byQuery = !q || post.title?.toLowerCase().includes(q) || post.caption?.toLowerCase().includes(q) || post.sellerName.toLowerCase().includes(q)
      const byStyle = style === ALL || post.styleTags.includes(style as any)
      return byQuery && byStyle
    })
  }, [inspirationPosts, query, style])

  const cols: Product[][] = [[], []]
  productResults.forEach((product, i) => cols[i % 2].push(product))

  return (
    <div className="relative h-full w-full max-w-[480px] overflow-hidden bg-base text-ink">
      <div className="space-y-3 px-4 pb-2" style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 16px)' }}>
        <div className="flex h-12 items-center gap-2 rounded-2xl bg-surface px-4">
          <Icon name="search" size={20} className="text-muted" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Найти товар, образ или продавца" className="h-full flex-1 bg-transparent text-[15px] outline-none" />
          {query && <button onClick={() => setQuery('')} className="text-muted"><Icon name="close" size={18} /></button>}
        </div>

        <div className="flex rounded-2xl bg-surface p-1">
          <button onClick={() => setMode('products')} className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-bold ${mode === 'products' ? 'bg-ink text-card shadow-soft' : 'text-muted'}`}><Icon name="bag" size={15} /> Товары</button>
          <button onClick={() => setMode('inspiration')} className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-bold ${mode === 'inspiration' ? 'bg-ink text-card shadow-soft' : 'text-muted'}`}><Icon name="sparkles" size={15} /> Вдохновение</button>
        </div>
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-2">
        {[ALL, ...categories.map((item) => item.name)].map((item) => <Chip key={item} active={category === item} onClick={() => setCategory(item)}>{item}</Chip>)}
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
        {[ALL, ...STYLE_OPTIONS].map((item) => <Chip key={item} active={style === item} onClick={() => setStyle(item)}>{item}</Chip>)}
        {[ALL, 'до 20k', '20-50k', '50k+'].map((item) => <Chip key={item} active={price === item} onClick={() => setPrice(item)}>{item}</Chip>)}
      </div>

      <div className="no-scrollbar h-[calc(100%-184px)] overflow-y-auto px-3 pb-28">
        {mode === 'products' ? (
          productResults.length === 0 ? <Empty /> : <div className="flex gap-3">{cols.map((col, ci) => <div key={ci} className="flex flex-1 flex-col gap-3">{col.map((product) => <ProductCard key={product.id} product={product} onOpen={() => setSelectedId(product.id)} />)}</div>)}</div>
        ) : (
          postResults.length === 0 ? <Empty text="Постов пока нет" /> : <div className="grid gap-3">{postResults.map((post) => <button key={post.id} onClick={() => (window.location.href = `/post/${post.id}`)} className="relative overflow-hidden rounded-3xl text-left"><Img src={post.coverUrl || post.mediaUrls[0]} alt={post.title || post.sellerName} fallbackLabel={post.sellerName} className="h-80 w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" /><div className="absolute bottom-4 left-4 right-4 text-white"><div className="text-xs font-bold text-magenta">{post.sellerName}</div><div className="text-lg font-extrabold">{post.title || 'Образ'}</div><div className="line-clamp-2 text-sm text-white/75">{post.caption}</div></div></button>)}</div>
        )}
      </div>

      <AnimatePresence>{selectedId && <FullscreenProductDetail key={selectedId} productId={selectedId} onBack={() => setSelectedId(null)} onSelect={(id) => setSelectedId(id)} />}</AnimatePresence>
    </div>
  )
}

function ProductCard({ product, onOpen }: { product: Product; onOpen: () => void }) {
  return <button onClick={onOpen} className="overflow-hidden rounded-3xl border border-ink/10 bg-ink/[0.04] text-left active:scale-[0.98]"><Img src={product.images[0]} alt={product.title} fallbackLabel={product.title} className="aspect-[3/4] w-full object-cover" /><div className="p-3"><div className="flex items-center gap-1 text-[11px] font-bold text-magenta"><Icon name="store" size={11} /> {product.sellerName}</div><div className="mt-0.5 truncate text-sm font-bold">{product.title}</div><div className="mt-1 text-sm font-extrabold tabular">{tenge(product.price)}</div></div></button>
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${active ? 'bg-magenta text-ink shadow-glow' : 'bg-surface text-ink'}`}>{children}</button>
}

function Empty({ text = 'Каталог пока пуст' }: { text?: string }) {
  return <div className="flex flex-col items-center justify-center gap-2 py-24 text-center text-muted"><Icon name="search" size={40} /><p className="font-semibold">{text}</p></div>
}
