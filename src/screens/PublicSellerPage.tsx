import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../components/Icon'
import { Img } from '../components/Img'
import { useStore } from '../store/useStore'
import { toggleFollowSeller, trackCmsEvent, useRuntimeCatalog } from '../lib/cms'
import { tenge } from '../lib/format'
import { track } from '../lib/analytics'
import { openSellerWhatsapp } from '../lib/whatsapp'

export function PublicSellerPage({ slug }: { slug: string }) {
  const { sellers, products, inspirationPosts } = useRuntimeCatalog()
  const seller = sellers.find((item) => item.slug === slug)
  const sellerProducts = seller ? products.filter((product) => product.sellerId === seller.id) : []
  const posts = seller ? inspirationPosts.filter((post) => post.sellerId === seller.id).sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || (a.pinnedOrder ?? 0) - (b.pinnedOrder ?? 0)) : []
  const followed = useStore((s) => seller ? s.user.followedSellerIds.includes(seller.id) : false)
  const authed = useStore((s) => s.authed || s.user.id === 'me')
  const openAuth = useStore((s) => s.openAuth)
  const openProduct = useStore((s) => s.openProduct)
  const showToast = useStore((s) => s.showToast)
  const [tab, setTab] = useState<'catalog' | 'inspiration'>('catalog')

  useEffect(() => {
    if (seller) {
      track('seller_page_viewed', { sellerId: seller.id, slug: seller.slug })
      trackCmsEvent({ eventName: 'seller_page_viewed', sellerId: seller.id, source: 'seller_page' })
    }
  }, [seller])

  if (!seller) {
    return <div className="flex h-full flex-col items-center justify-center bg-base px-8 text-center text-ink"><Icon name="store" size={42} className="text-muted" /><h1 className="mt-3 text-xl font-extrabold">Продавец не найден</h1><button onClick={() => (window.location.href = '/')} className="mt-5 rounded-2xl bg-magenta px-5 py-3 font-bold">В Discovery</button></div>
  }

  const share = async () => {
    const url = `${window.location.origin}/seller/${seller.slug}`
    try {
      if (navigator.share) await navigator.share({ title: seller.name, text: seller.description, url })
      else {
        await navigator.clipboard?.writeText(url)
        showToast('Ссылка на продавца скопирована')
      }
    } catch {}
  }

  const follow = () => {
    if (!authed) {
      openAuth()
      return
    }
    toggleFollowSeller(seller.id)
    useStore.setState((state) => ({
      user: {
        ...state.user,
        followedSellerIds: state.user.followedSellerIds.includes(seller.id)
          ? state.user.followedSellerIds.filter((id) => id !== seller.id)
          : [seller.id, ...state.user.followedSellerIds],
      },
    }))
    track('follow_clicked', { sellerId: seller.id })
    trackCmsEvent({ eventName: followed ? 'follow_removed' : 'follow_created', sellerId: seller.id, source: 'seller_page' })
  }

  return (
    <div className="relative h-full w-full max-w-[480px] overflow-hidden bg-base text-ink">
      <div className="no-scrollbar h-full overflow-y-auto pb-28">
        <div className="relative h-56 bg-surface">
          <Img src={seller.coverUrl} alt={seller.name} fallbackLabel={seller.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-base via-base/20 to-black/25" />
          <div className="absolute left-4 right-4 top-4 flex justify-between" style={{ paddingTop: 'env(safe-area-inset-top,0px)' }}>
            <button onClick={() => (window.location.href = '/')} className="flex h-10 w-10 items-center justify-center rounded-full glass-dark text-white"><Icon name="chevronLeft" size={22} /></button>
            <button onClick={share} className="flex h-10 w-10 items-center justify-center rounded-full glass-dark text-white"><Icon name="share" size={20} /></button>
          </div>
        </div>

        <section className="-mt-14 px-4">
          <Img src={seller.logoUrl} alt={seller.name} fallbackLabel={seller.name[0]} className="relative z-10 h-24 w-24 rounded-3xl border-4 border-base object-cover shadow-soft" />
          <h1 className="mt-3 font-display text-3xl font-extrabold">{seller.name}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted"><Icon name="pin" size={15} /> {seller.city || 'Город не указан'}</div>
          {seller.description && <p className="mt-3 text-[15px] leading-relaxed text-ink/75">{seller.description}</p>}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => seller.whatsapp ? window.open(`https://wa.me/${seller.whatsapp.replace(/\D/g, '')}`, '_blank') : showToast('WhatsApp продавца пока не заполнен')} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-surface font-bold"><Icon name="phone" size={18} /> WhatsApp</button>
            <button onClick={follow} className={`flex h-12 items-center justify-center gap-2 rounded-2xl font-bold ${followed ? 'bg-magenta' : 'bg-surface'}`}><Icon name={followed ? 'heartFill' : 'heart'} size={18} /> {followed ? 'Вы подписаны' : 'Подписаться'}</button>
            {seller.instagram && <a href={seller.instagram.startsWith('http') ? seller.instagram : `https://instagram.com/${seller.instagram.replace(/^@/, '')}`} target="_blank" className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-surface font-bold"><Icon name="share" size={18} /> Instagram</a>}
            <button onClick={share} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-surface font-bold"><Icon name="share" size={18} /> Поделиться</button>
          </div>
        </section>

        <div className="sticky top-0 z-20 mt-6 bg-base/95 px-4 py-3 backdrop-blur">
          <div className="flex rounded-2xl bg-surface p-1">
            <button onClick={() => setTab('catalog')} className={`flex-1 rounded-xl py-2 text-sm font-bold ${tab === 'catalog' ? 'bg-ink text-card' : 'text-muted'}`}>Каталог</button>
            <button onClick={() => setTab('inspiration')} className={`flex-1 rounded-xl py-2 text-sm font-bold ${tab === 'inspiration' ? 'bg-ink text-card' : 'text-muted'}`}>Вдохновение</button>
          </div>
        </div>

        <section className="px-4">
          {tab === 'catalog' ? (
            <div className="grid grid-cols-2 gap-3">
              {sellerProducts.length === 0 && <div className="col-span-2 rounded-3xl border border-dashed border-ink/15 p-8 text-center text-muted">У продавца пока нет товаров</div>}
              {sellerProducts.map((product) => (
                <div key={product.id} className="overflow-hidden rounded-3xl bg-ink/[0.04]">
                  <button onClick={() => openProduct(product.id)} className="w-full text-left">
                    <Img src={product.images[0]} alt={product.title} fallbackLabel={product.title} className="aspect-[3/4] w-full object-cover" />
                    <div className="p-3">
                      <div className="truncate text-sm font-bold">{product.title}</div>
                      <div className="mt-1 text-sm font-extrabold tabular">{tenge(product.price)}</div>
                      <div className="mt-1 text-[11px] text-muted">{product.sizes.join(', ')}</div>
                    </div>
                  </button>
                  <button onClick={() => openSellerWhatsapp({ product, source: 'seller_catalog' }, () => showToast('Добавьте WhatsApp продавца'))} className="mx-3 mb-3 h-10 w-[calc(100%-24px)] rounded-2xl bg-magenta text-xs font-extrabold">Написать в WhatsApp</button>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {posts.length === 0 && <div className="rounded-3xl border border-dashed border-ink/15 p-8 text-center text-muted">У продавца пока нет постов</div>}
              {posts.map((post) => (
                <button key={post.id} onClick={() => (window.location.href = `/post/${post.id}`)} className="relative block w-full overflow-hidden rounded-3xl text-left">
                  <Img src={post.coverUrl || post.mediaUrls[0]} alt={post.title || post.caption || seller.name} fallbackLabel={seller.name} className="h-80 w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                  {post.isPinned && <span className="absolute left-3 top-3 rounded-full bg-magenta px-3 py-1 text-xs font-bold text-white">Закреплено</span>}
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <div className="text-lg font-extrabold">{post.title || 'Образ'}</div>
                    <div className="line-clamp-2 text-sm text-white/75">{post.caption}</div>
                    <div className="mt-2 text-xs font-bold text-magenta">{post.taggedProducts.length ? `${post.taggedProducts.length} товаров` : 'без отмеченных товаров'}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
