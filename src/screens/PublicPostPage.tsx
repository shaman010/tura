import { useEffect } from 'react'
import { Icon } from '../components/Icon'
import { Img } from '../components/Img'
import { useStore } from '../store/useStore'
import { track } from '../lib/analytics'
import { trackCmsEvent, toggleSavedPost, useRuntimeCatalog } from '../lib/cms'
import { tenge } from '../lib/format'
import { openSellerWhatsapp } from '../lib/whatsapp'
import type { Product } from '../types'

export function PublicPostPage({ id }: { id: string }) {
  const { inspirationPosts, products } = useRuntimeCatalog()
  const post = inspirationPosts.find((item) => item.id === id)
  const saved = useStore((s) => s.user.savedPosts.includes(id))
  const showToast = useStore((s) => s.showToast)
  const openProduct = useStore((s) => s.openProduct)

  useEffect(() => {
    if (post) {
      track('post_viewed', { postId: post.id, sellerId: post.sellerId })
      trackCmsEvent({ eventName: 'post_viewed', postId: post.id, sellerId: post.sellerId, source: 'post_page' })
    }
  }, [post])

  if (!post) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-base px-8 text-center text-ink">
        <Icon name="sparkles" size={42} className="text-muted" />
        <h1 className="mt-3 text-xl font-extrabold">Пост не найден</h1>
        <button onClick={() => (window.location.href = '/')} className="mt-5 rounded-2xl bg-magenta px-5 py-3 font-bold">В Discovery</button>
      </div>
    )
  }

  const media = post.mediaUrls[0] || post.coverUrl || ''
  const isVideo = post.mediaType === 'video' || /\.(mp4|mov|webm)(\?|$)/i.test(media)
  const tagged = post.taggedProducts.map((tag) => products.find((product) => product.id === tag.productId)).filter(Boolean) as Product[]

  const save = () => {
    toggleSavedPost(post.id)
    useStore.setState((state) => ({
      user: {
        ...state.user,
        savedPosts: state.user.savedPosts.includes(post.id)
          ? state.user.savedPosts.filter((item) => item !== post.id)
          : [post.id, ...state.user.savedPosts],
      },
    }))
    track('post_saved', { postId: post.id, sellerId: post.sellerId })
  }

  const share = async () => {
    const url = `${window.location.origin}/post/${post.id}`
    try {
      if (navigator.share) await navigator.share({ title: post.title || post.sellerName, text: post.caption, url })
      else {
        await navigator.clipboard?.writeText(url)
        showToast('Ссылка на образ скопирована')
      }
    } catch {}
  }

  return (
    <div className="relative h-full w-full max-w-[480px] overflow-hidden bg-base text-ink">
      <div className="no-scrollbar h-full overflow-y-auto pb-28">
        <div className="relative bg-black">
          {isVideo ? <video src={media} poster={post.coverUrl} controls playsInline className="max-h-[70vh] w-full object-cover" /> : <Img src={media} alt={post.title || post.sellerName} fallbackLabel={post.sellerName} className="max-h-[70vh] w-full object-cover" />}
          <div className="absolute left-4 right-4 top-4 flex justify-between" style={{ paddingTop: 'env(safe-area-inset-top,0px)' }}>
            <button onClick={() => history.back()} className="flex h-10 w-10 items-center justify-center rounded-full glass-dark text-white"><Icon name="chevronLeft" size={22} /></button>
            <button onClick={share} className="flex h-10 w-10 items-center justify-center rounded-full glass-dark text-white"><Icon name="share" size={20} /></button>
          </div>
        </div>

        <section className="space-y-4 px-4 pt-5">
          <button onClick={() => (window.location.href = `/seller/${post.sellerSlug}`)} className="flex items-center gap-3 text-left">
            <Img src={post.sellerLogoUrl || ''} alt={post.sellerName} fallbackLabel={post.sellerName[0]} className="h-12 w-12 rounded-2xl object-cover" />
            <div>
              <div className="font-extrabold">{post.sellerName}</div>
              <div className="text-xs text-muted">перейти к продавцу</div>
            </div>
          </button>

          <div>
            <h1 className="text-2xl font-extrabold">{post.title || 'Образ'}</h1>
            {post.caption && <p className="mt-2 leading-relaxed text-ink/75">{post.caption}</p>}
          </div>

          <div className="flex gap-2">
            <button onClick={save} className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl font-bold ${saved ? 'bg-magenta' : 'bg-surface'}`}>
              <Icon name={saved ? 'bookmarkFill' : 'bookmark'} size={18} /> Сохранить
            </button>
            <button onClick={() => (window.location.href = `/seller/${post.sellerSlug}`)} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-surface font-bold">
              <Icon name="store" size={18} /> Продавец
            </button>
          </div>

          <section>
            <h2 className="mb-3 text-lg font-extrabold">В этом образе</h2>
            {tagged.length ? (
              <div className="space-y-3">
                {tagged.map((product) => (
                  <div key={product.id} className="flex gap-3 rounded-3xl bg-ink/[0.04] p-3">
                    <button onClick={() => openProduct(product.id)} className="flex min-w-0 flex-1 gap-3 text-left">
                      <Img src={product.images[0]} alt={product.title} fallbackLabel={product.title} className="h-20 w-16 rounded-2xl object-cover" />
                      <div className="min-w-0">
                        <div className="truncate font-bold">{product.title}</div>
                        <div className="mt-1 text-sm font-extrabold">{tenge(product.price)}</div>
                        <div className="mt-1 text-xs text-muted">{product.sizes.join(', ')}</div>
                      </div>
                    </button>
                    <button onClick={() => openSellerWhatsapp({ product, post, source: 'post_page' }, () => showToast('Добавьте WhatsApp продавца'))} className="self-center rounded-2xl bg-magenta px-3 py-3 text-xs font-extrabold">WhatsApp</button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-ink/15 p-6 text-center text-muted">В этом посте нет отмеченных товаров.</div>
            )}
          </section>
        </section>
      </div>
    </div>
  )
}
