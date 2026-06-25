import { useEffect } from 'react'
import { Icon } from '../components/Icon'
import { Img } from '../components/Img'
import { useStore } from '../store/useStore'
import { useRuntimeCatalog } from '../lib/cms'
import { tenge } from '../lib/format'
import { track } from '../lib/analytics'

export function PublicSellerPage({ slug }: { slug: string }) {
  const { sellers, products: allProducts } = useRuntimeCatalog()
  const seller = sellers.find((item) => item.slug === slug)
  const openProduct = useStore((s) => s.openProduct)
  const setTab = useStore((s) => s.setTab)
  const showToast = useStore((s) => s.showToast)
  const products = seller ? allProducts.filter((product) => product.sellerSlug === seller.slug) : []

  useEffect(() => {
    if (seller) track('seller_page_opened', { sellerId: seller.id, slug: seller.slug })
  }, [seller])

  if (!seller) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-base px-8 text-center text-ink">
        <Icon name="store" size={42} className="text-muted" />
        <h1 className="mt-3 text-xl font-extrabold">Продавец не найден</h1>
        <button onClick={() => (window.location.href = '/')} className="mt-5 rounded-2xl bg-magenta px-5 py-3 font-bold">
          В Discovery
        </button>
      </div>
    )
  }

  const share = async () => {
    const url = `${window.location.origin}/seller/${seller.slug}`
    try {
      if (navigator.share) await navigator.share({ title: seller.name, text: seller.description, url })
      else {
        await navigator.clipboard?.writeText(url)
        showToast('Ссылка на продавца скопирована')
      }
    } catch {
      /* cancelled */
    }
  }

  const whatsapp = () => {
    track('whatsapp_clicked', { sellerId: seller.id, source: 'seller_page' })
    if (seller.whatsapp) window.open(`https://wa.me/${seller.whatsapp.replace(/\D/g, '')}`, '_blank')
    else showToast('Контакт продавца появится после заявки')
  }

  const firstProduct = products[0]

  return (
    <div className="relative h-full w-full max-w-[480px] overflow-hidden bg-base text-ink">
      <div className="no-scrollbar h-full overflow-y-auto pb-28">
        <div className="relative h-56 bg-surface">
          <Img src={seller.coverUrl} alt={seller.name} fallbackLabel={seller.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-base via-base/20 to-black/25" />
          <div className="absolute left-4 right-4 top-4 flex justify-between" style={{ paddingTop: 'env(safe-area-inset-top,0px)' }}>
            <button onClick={() => (window.location.href = '/')} className="flex h-10 w-10 items-center justify-center rounded-full glass-dark text-white">
              <Icon name="chevronLeft" size={22} />
            </button>
            <button onClick={share} className="flex h-10 w-10 items-center justify-center rounded-full glass-dark text-white">
              <Icon name="share" size={20} />
            </button>
          </div>
        </div>

        <section className="-mt-14 px-4">
          <div className="relative z-10">
            <Img src={seller.logoUrl} alt={seller.name} fallbackLabel={seller.name[0]} className="h-24 w-24 rounded-3xl border-4 border-base object-cover shadow-soft" />
            <h1 className="mt-3 font-display text-3xl font-extrabold">{seller.name}</h1>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted">
              <Icon name="pin" size={15} /> {seller.city}
            </div>
            <p className="mt-3 text-[15px] leading-relaxed text-ink/75">{seller.description}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={whatsapp} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-surface font-bold">
                <Icon name="phone" size={18} /> WhatsApp
              </button>
              <button onClick={share} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-surface font-bold">
                <Icon name="share" size={18} /> Поделиться
              </button>
              {firstProduct && (
                <button
                  onClick={() => useStore.getState().buyNow(firstProduct.id, firstProduct.sizes[0], firstProduct.colors[0]?.name ?? '', 'seller_page')}
                  className="col-span-2 flex h-13 items-center justify-center gap-2 rounded-2xl bg-grad-accent font-bold text-ink shadow-glow"
                >
                  <Icon name="send" size={20} /> Оставить заявку
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="px-4 pt-7">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-extrabold">Товары продавца</h2>
            <button
              onClick={() => {
                setTab('discovery')
                window.history.pushState({}, '', '/')
              }}
              className="text-sm font-bold text-magenta"
            >
              Discovery
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {products.length === 0 && <div className="col-span-2 rounded-3xl border border-dashed border-ink/15 p-8 text-center text-muted">У продавца пока нет товаров</div>}
            {products.map((p) => (
              <button key={p.id} onClick={() => openProduct(p.id)} className="overflow-hidden rounded-3xl bg-ink/[0.04] text-left active:scale-[0.98]">
                <Img src={p.images[0]} alt={p.title} fallbackLabel={p.title} className="aspect-[3/4] w-full object-cover" />
                <div className="p-3">
                  <div className="truncate text-sm font-bold">{p.title}</div>
                  <div className="mt-1 text-sm font-extrabold tabular">{tenge(p.price)}</div>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
