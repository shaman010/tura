import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Icon } from '../components/Icon'
import { Img } from '../components/Img'
import { SwipeHints } from '../components/SwipeHints'
import { useStore } from '../store/useStore'
import { rankPosts, WEIGHTS } from '../lib/recommendations'
import { track } from '../lib/analytics'
import { trackCmsEvent, toggleSavedPost, useRuntimeCatalog } from '../lib/cms'
import { tenge } from '../lib/format'
import { openSellerWhatsapp } from '../lib/whatsapp'
import type { InspirationPost, Product } from '../types'

export function Discovery() {
  const prefs = useStore((s) => s.user.stylePreferences)
  const followedSellerIds = useStore((s) => s.user.followedSellerIds)
  const setTab = useStore((s) => s.setTab)
  const { inspirationPosts } = useRuntimeCatalog()
  const [feedTab, setFeedTab] = useState<'forYou' | 'following'>('forYou')
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastIndex = useRef(0)

  useEffect(() => {
    track('discovery_opened')
  }, [])

  const ranked = useMemo(() => rankPosts(inspirationPosts, prefs), [inspirationPosts, prefs])
  const displayed = useMemo(() => {
    if (feedTab === 'forYou') return ranked
    return ranked.filter((post) => followedSellerIds.includes(post.sellerId))
  }, [feedTab, followedSellerIds, ranked])

  const onScroll = () => {
    const el = containerRef.current
    if (!el) return
    const idx = Math.round(el.scrollTop / el.clientHeight)
    if (idx !== lastIndex.current) {
      const post = displayed[idx]
      setActiveIndex(idx)
      if (post) {
        track('discovery_post_viewed', { postId: post.id, sellerId: post.sellerId })
        trackCmsEvent({ eventName: 'discovery_post_viewed', postId: post.id, sellerId: post.sellerId, source: 'discovery' })
      }
      lastIndex.current = idx
    }
  }

  const tab = (key: 'forYou' | 'following', label: string) => (
    <button onClick={() => setFeedTab(key)} className={`relative drop-shadow ${feedTab === key ? 'text-white' : 'text-white/50'}`}>
      {label}
      {feedTab === key && <span className="absolute -bottom-1.5 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-magenta" />}
    </button>
  )

  return (
    <div className="media-dark relative h-full w-full max-w-[480px] bg-black">
      {displayed.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-10 text-center text-white">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.05]">
            <Icon name="sparkles" size={30} />
          </div>
          <h2 className="text-xl font-extrabold">Пока нет вдохновения</h2>
          <p className="text-sm text-white/60">Добавьте посты через Studio или Admin. Discovery показывает образы, видео и лукбуки продавцов.</p>
          <button onClick={() => setTab('search')} className="mt-2 flex h-12 items-center gap-2 rounded-2xl bg-grad-accent px-6 font-bold text-white shadow-glow active:scale-95">
            <Icon name="search" size={18} /> Каталог
          </button>
        </div>
      ) : (
        <div ref={containerRef} onScroll={onScroll} className="no-scrollbar h-full snap-y snap-mandatory overflow-y-scroll">
          {displayed.map((post, i) => (
            <PostSlide key={post.id} post={post} playing={i === activeIndex} />
          ))}
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-center" style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 16px)' }}>
        <div className="pointer-events-auto flex items-center gap-6 text-[15px] font-bold">
          {tab('forYou', 'Для вас')}
          {tab('following', 'Подписки')}
        </div>
      </div>

      <SwipeHints />
    </div>
  )
}

function PostSlide({ post, playing }: { post: InspirationPost; playing: boolean }) {
  const { products } = useRuntimeCatalog()
  const videoMuted = useStore((s) => s.videoMuted)
  const toggleMute = useStore((s) => s.toggleMute)
  const showToast = useStore((s) => s.showToast)
  const openProduct = useStore((s) => s.openProduct)
  const saved = useStore((s) => s.user.savedPosts.includes(post.id))
  const media = post.mediaUrls[0] || post.coverUrl || ''
  const isVideo = post.mediaType === 'video' || /\.(mp4|mov|webm)(\?|$)/i.test(media)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [heart, setHeart] = useState(false)
  const tagged = post.taggedProducts
    .map((tag) => products.find((product) => product.id === tag.productId))
    .filter(Boolean) as Product[]

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    el.muted = videoMuted
    if (playing) el.play().catch(() => {})
    else el.pause()
  }, [playing, videoMuted])

  const savePost = () => {
    toggleSavedPost(post.id)
    useStore.setState((state) => ({
      user: {
        ...state.user,
        savedPosts: state.user.savedPosts.includes(post.id)
          ? state.user.savedPosts.filter((id) => id !== post.id)
          : [post.id, ...state.user.savedPosts],
        stylePreferences: bumpTags(state.user.stylePreferences, [...post.styleTags, ...post.occasionTags, ...post.ageRangeTags, post.gender], WEIGHTS.save),
      },
    }))
    track('post_saved', { postId: post.id, sellerId: post.sellerId })
    trackCmsEvent({ eventName: 'post_saved', postId: post.id, sellerId: post.sellerId, source: 'discovery' })
  }

  const doubleTap = () => {
    if (!saved) savePost()
    setHeart(true)
    window.setTimeout(() => setHeart(false), 650)
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
    <section className="relative h-full w-full snap-start snap-always overflow-hidden">
      <button onDoubleClick={doubleTap} onClick={() => (window.location.href = `/post/${post.id}`)} className="absolute inset-0 text-left">
        {isVideo ? (
          <video ref={videoRef} src={media} poster={post.coverUrl} className="h-full w-full bg-black object-cover" loop playsInline />
        ) : (
          <Img src={media} alt={post.title || post.caption || post.sellerName} fallbackLabel={post.sellerName} className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/5 to-black/20" />
      </button>

      <AnimatePresence>
        {heart && (
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.35, opacity: 0 }} className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-magenta text-white shadow-glow">
              <Icon name="heartFill" size={56} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isVideo && (
        <button onClick={toggleMute} className="absolute right-3 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 glass-dark text-white active:scale-90" style={{ top: 'calc(env(safe-area-inset-top,0px) + 56px)' }}>
          <Icon name={videoMuted ? 'volumeOff' : 'volume'} size={20} />
        </button>
      )}

      <div className="absolute bottom-[230px] right-3 z-20 flex flex-col items-center gap-5">
        <RailBtn icon={saved ? 'bookmarkFill' : 'bookmark'} label={String(post.savesCount + (saved ? 1 : 0))} active={saved} onClick={savePost} />
        <RailBtn icon="share" label={String(post.sharesCount)} onClick={share} />
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 px-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 92px)' }}>
        <div className="mb-3 max-w-[86%] text-white">
          <button onClick={() => (window.location.href = `/seller/${post.sellerSlug}`)} className="mb-2 flex items-center gap-2 text-xs font-bold text-white/85">
            <Icon name="store" size={12} /> {post.sellerName}
          </button>
          <h2 className="text-2xl font-extrabold leading-[1.12]">{post.title || 'Образ дня'}</h2>
          {post.caption && <p className="mt-1 line-clamp-2 text-sm text-white/75">{post.caption}</p>}
        </div>

        <div className="rounded-[24px] border border-white/10 glass-dark p-3">
          <div className="mb-2 flex items-center justify-between text-white">
            <span className="text-sm font-extrabold">В этом образе</span>
            <button onClick={() => (window.location.href = `/post/${post.id}`)} className="text-xs font-bold text-magenta">Открыть</button>
          </div>
          {tagged.length ? (
            <div className="flex gap-2 overflow-x-auto">
              {tagged.map((product) => (
                <div key={product.id} className="w-36 shrink-0 rounded-2xl bg-white/10 p-2 text-white">
                  <button onClick={() => openProduct(product.id)} className="w-full text-left">
                    <Img src={product.images[0]} alt={product.title} fallbackLabel={product.title} className="h-20 w-full rounded-xl object-cover" />
                    <div className="mt-1 truncate text-xs font-bold">{product.title}</div>
                    <div className="text-xs font-extrabold">{tenge(product.price)}</div>
                  </button>
                  <button onClick={() => openSellerWhatsapp({ product, post, source: 'discovery' }, () => showToast('Добавьте WhatsApp продавца'))} className="mt-2 w-full rounded-xl bg-magenta px-2 py-2 text-xs font-extrabold">WhatsApp</button>
                </div>
              ))}
            </div>
          ) : (
            <button onClick={() => (window.location.href = `/seller/${post.sellerSlug}`)} className="w-full rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white">Перейти к продавцу</button>
          )}
        </div>
      </div>
    </section>
  )
}

function bumpTags(prefs: Record<string, number>, tags: string[], delta: number) {
  const next = { ...prefs }
  tags.forEach((tag) => {
    next[tag] = Math.min(80, (next[tag] ?? 0) + delta)
  })
  return next
}

function RailBtn({ icon, label, onClick, active }: { icon: Parameters<typeof Icon>[0]['name']; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 active:scale-90">
      <span className={active ? 'text-magenta drop-shadow' : 'text-white drop-shadow'}><Icon name={icon} size={29} /></span>
      <span className="text-[11px] font-semibold text-white drop-shadow">{label}</span>
    </button>
  )
}
