import { useMemo, useState } from 'react'
import { Icon } from '../components/Icon'
import { Img } from '../components/Img'
import { useStore } from '../store/useStore'
import { productById } from '../data/products'
import { useRuntimeCatalog } from '../lib/cms'
import { tenge } from '../lib/format'
import { track } from '../lib/analytics'

export function PublicProductPage({ id }: { id: string }) {
  const { products } = useRuntimeCatalog()
  const product = productById(id)
  const showToast = useStore((s) => s.showToast)
  const openProduct = useStore((s) => s.openProduct)
  const [gallery, setGallery] = useState(0)
  const [size, setSize] = useState(product?.sizes[0] ?? '')
  const [color, setColor] = useState(product?.colors[0]?.name ?? '')

  const similar = useMemo(() => {
    if (!product) return []
    return products.filter((p) => p.id !== product.id && p.isActive !== false && p.category === product.category).slice(0, 4)
  }, [product, products])

  if (!product) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-base px-8 text-center text-ink">
        <Icon name="box" size={42} className="text-muted" />
        <h1 className="mt-3 text-xl font-extrabold">Товар не найден</h1>
        <button onClick={() => (window.location.href = '/')} className="mt-5 rounded-2xl bg-magenta px-5 py-3 font-bold">
          В Discovery
        </button>
      </div>
    )
  }

  const leaveLead = () => {
    track('lead_form_opened', { productId: product.id, source: 'product_page' })
    useStore.getState().buyNow(product.id, size || product.sizes[0], color || (product.colors[0]?.name ?? ''), 'product_page')
  }
  const messageSeller = () => {
    track('whatsapp_clicked', { productId: product.id, sellerId: product.sellerId, source: 'product_page' })
    const text = encodeURIComponent(`Здравствуйте! Хочу уточнить наличие: ${product.title} ${window.location.href}`)
    if (product.sellerWhatsApp) window.open(`https://wa.me/${product.sellerWhatsApp.replace(/\D/g, '')}?text=${text}`, '_blank')
    else showToast('Контакт продавца появится после заявки')
  }
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: product.title, text: product.description, url: window.location.href })
      else {
        await navigator.clipboard?.writeText(window.location.href)
        showToast('Ссылка на товар скопирована')
      }
    } catch {
      /* cancelled */
    }
  }

  return (
    <div className="relative h-full w-full max-w-[480px] overflow-hidden bg-base text-ink">
      <div className="no-scrollbar h-full overflow-y-auto pb-32">
        <div className="relative aspect-[4/5] bg-surface">
          <Img src={product.images[gallery]} alt={product.title} fallbackLabel={product.title} className="h-full w-full object-cover" />
          <div className="absolute left-4 right-4 top-4 flex justify-between" style={{ paddingTop: 'env(safe-area-inset-top,0px)' }}>
            <button onClick={() => (window.location.href = `/seller/${product.sellerSlug}`)} className="flex h-10 w-10 items-center justify-center rounded-full glass-dark text-white">
              <Icon name="chevronLeft" size={22} />
            </button>
            <button onClick={share} className="flex h-10 w-10 items-center justify-center rounded-full glass-dark text-white">
              <Icon name="share" size={20} />
            </button>
          </div>
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {product.images.map((_, i) => (
              <button key={i} onClick={() => setGallery(i)} className={`h-1.5 rounded-full ${i === gallery ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`} />
            ))}
          </div>
        </div>

        <section className="space-y-5 px-5 pt-5">
          <div>
            <button onClick={() => (window.location.href = `/seller/${product.sellerSlug}`)} className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-magenta">
              <Icon name="store" size={13} /> {product.sellerName}
              <Icon name="chevronRight" size={13} />
            </button>
            <h1 className="mt-1 font-display text-3xl font-extrabold leading-tight">{product.title}</h1>
            <div className="mt-2 text-2xl font-extrabold tabular">{tenge(product.price)}</div>
          </div>

          <Selector title="Размер" value={size}>
            {product.sizes.map((sz) => (
              <button key={sz} onClick={() => setSize(sz)} className={`h-11 rounded-2xl border px-4 text-sm font-bold ${size === sz ? 'border-magenta bg-ink text-card' : 'border-ink/10 bg-ink/[0.03]'}`}>
                {sz}
              </button>
            ))}
          </Selector>

          <Selector title="Цвет" value={color}>
            {product.colors.map((c) => (
              <button key={c.name} onClick={() => setColor(c.name)} className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold ${color === c.name ? 'border-magenta bg-magenta/10' : 'border-ink/10 bg-ink/[0.03]'}`}>
                <span className="h-5 w-5 rounded-full border border-ink/20" style={{ background: c.hex }} />
                {c.name}
              </button>
            ))}
          </Selector>

          <p className="text-[15px] leading-relaxed text-ink/80">{product.description}</p>
          <div className="rounded-3xl bg-surface p-4 text-sm text-muted">{product.delivery}</div>

          {similar.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-extrabold">Похожие товары</h2>
              <div className="grid grid-cols-2 gap-3">
                {similar.map((p) => (
                  <button key={p.id} onClick={() => openProduct(p.id)} className="overflow-hidden rounded-3xl bg-ink/[0.04] text-left">
                    <Img src={p.images[0]} alt={p.title} fallbackLabel={p.title} className="aspect-[3/4] w-full object-cover" />
                    <div className="p-3">
                      <div className="truncate text-sm font-bold">{p.title}</div>
                      <div className="text-sm font-extrabold tabular">{tenge(p.price)}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 flex gap-2 border-t border-ink/10 bg-base/95 px-4 pt-3 backdrop-blur-xl" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 12px)' }}>
        <button onClick={messageSeller} className="flex h-13 flex-shrink-0 items-center justify-center gap-2 rounded-2xl bg-surface px-4 font-bold">
          <Icon name="phone" size={19} /> Написать
        </button>
        <button onClick={leaveLead} className="flex h-13 flex-1 items-center justify-center gap-2 rounded-2xl bg-magenta font-bold text-ink shadow-glow">
          <Icon name="send" size={19} /> Оставить заявку
        </button>
      </div>
    </div>
  )
}

function Selector({ title, value, children }: { title: string; value: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[24px] border border-ink/10 bg-ink/[0.04] p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-bold">{title}</span>
        <span className="text-xs text-muted">{value}</span>
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}
