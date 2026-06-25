import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion'
import { Icon } from '../components/Icon'
import { Img } from '../components/Img'
import { SwipeHints } from '../components/SwipeHints'
import { ReviewsSheet } from '../components/ReviewsSheet'
import { useStore } from '../store/useStore'
import { productById } from '../data/products'
import { rankFeed } from '../lib/recommendations'
import { track } from '../lib/analytics'
import { tenge, compact } from '../lib/format'
import { useRuntimeCatalog } from '../lib/cms'
import type { FeedItem } from '../types'

export function Discovery() {
  const prefs = useStore((s) => s.user.stylePreferences)
  const disliked = useStore((s) => s.user.dislikedProducts)
  const subscribedBrands = useStore((s) => s.user.subscribedBrands)
  const setTab = useStore((s) => s.setTab)
  const { feed } = useRuntimeCatalog()
  const [feedTab, setFeedTab] = useState<'forYou' | 'following'>('forYou')

  useEffect(() => {
    track('discovery_opened')
  }, [])

  const ranked = useMemo(
    () => rankFeed(feed, productById, prefs, disliked),
    [feed, prefs, disliked],
  )
  // лента «Подписки» — только товары магазинов, на которые подписан
  const displayed = useMemo(() => {
    if (feedTab === 'forYou') return ranked
    return ranked.filter((it) => {
      const p = productById(it.productId)
      return p && subscribedBrands.includes(p.brand)
    })
  }, [feedTab, ranked, subscribedBrands])

  const containerRef = useRef<HTMLDivElement>(null)
  const lastIndex = useRef(0)
  const [activeIndex, setActiveIndex] = useState(0)

  // сброс прокрутки при смене вкладки
  useEffect(() => {
    lastIndex.current = 0
    setActiveIndex(0)
    containerRef.current?.scrollTo({ top: 0 })
  }, [feedTab])

  const onScroll = () => {
    const el = containerRef.current
    if (!el) return
    const idx = Math.round(el.scrollTop / el.clientHeight)
    if (idx !== lastIndex.current) {
      setActiveIndex(idx) // только видимое видео играет (как в TikTok)
      track(idx > lastIndex.current ? 'swipe_up' : 'swipe_down')
      const item = displayed[idx]
      if (item) {
        track('feed_view', { productId: item.productId, index: idx })
        track('feed_item_viewed', { productId: item.productId, index: idx })
      }
      lastIndex.current = idx
    }
  }

  const tab = (key: 'forYou' | 'following', label: string) => {
    const active = feedTab === key
    return (
      <button onClick={() => setFeedTab(key)} className={`relative drop-shadow ${active ? 'text-white' : 'text-white/50'}`}>
        {label}
        {active && <span className="absolute -bottom-1.5 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-magenta" />}
      </button>
    )
  }

  return (
    <div className="media-dark relative h-full w-full max-w-[480px] bg-black">
      {displayed.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-10 text-center text-white">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.05]">
            <Icon name="store" size={30} />
          </div>
          <h2 className="text-xl font-extrabold">Пока нет контента</h2>
          <p className="text-sm text-white/60">Добавьте товары и видео через админку.</p>
          <button onClick={() => setTab('search')} className="mt-2 flex h-12 items-center gap-2 rounded-2xl bg-grad-accent px-6 font-bold text-white shadow-glow active:scale-95">
            <Icon name="search" size={18} /> Каталог
          </button>
        </div>
      ) : (
        <div ref={containerRef} onScroll={onScroll} className="no-scrollbar h-full snap-y snap-mandatory overflow-y-scroll">
          {displayed.map((item, i) => (
            <Slide key={item.id} item={item} active={Math.abs(i - activeIndex) <= 1} playing={i === activeIndex} />
          ))}
        </div>
      )}

      {/* fixed top tabs */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-center"
        style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 16px)' }}
      >
        <div className="pointer-events-auto flex items-center gap-6 text-[15px] font-bold">
          {tab('forYou', 'Для вас')}
          {tab('following', 'Подписки')}
        </div>
      </div>

      <SwipeHints />
    </div>
  )
}

function Slide({ item, active, playing }: { item: FeedItem; active: boolean; playing: boolean }) {
  const product = productById(item.productId)
  const like = useStore((s) => s.like)
  const dislike = useStore((s) => s.dislike)
  const registerSwipe = useStore((s) => s.registerSwipe)
  const addToCart = useStore((s) => s.addToCart)
  const openProduct = useStore((s) => s.openProduct)
  const openStore = useStore((s) => s.openStore)
  const showToast = useStore((s) => s.showToast)
  const flyToCart = useStore((s) => s.flyToCart)
  const liked = useStore((s) => s.user.likedProducts.includes(item.productId))
  const inCart = useStore((s) => s.user.cart.some((c) => c.productId === item.productId))
  const videoMuted = useStore((s) => s.videoMuted)
  const toggleMute = useStore((s) => s.toggleMute)

  const [overlay, setOverlay] = useState<'like' | 'nope' | null>(null)
  const [tapHeart, setTapHeart] = useState(false)
  const [reviewsOpen, setReviewsOpen] = useState(false)
  const pressTimer = useRef<number | null>(null)
  const dragged = useRef(false)

  const onShare = async () => {
    try {
      if (navigator.share) await navigator.share({ title: product?.title ?? 'Swipd', text: item.description })
      else showToast('Ссылка скопирована')
    } catch {
      /* отменено */
    }
  }

  const x = useMotionValue(0)
  const likeOpacity = useTransform(x, [30, 130], [0, 1])
  const nopeOpacity = useTransform(x, [-130, -30], [1, 0])
  const rotate = useTransform(x, [-220, 220], [-10, 10])

  if (!product) return null

  const flash = (kind: 'like' | 'nope') => {
    setOverlay(kind)
    window.setTimeout(() => setOverlay(null), 600)
  }
  const doLike = () => {
    if (liked) {
      flash('like')
      return
    }
    like(item.productId)
    registerSwipe()
    flash('like')
  }
  const doubleTapLike = () => {
    if (pressTimer.current) window.clearTimeout(pressTimer.current)
    doLike()
    setTapHeart(true)
    window.setTimeout(() => setTapHeart(false), 650)
  }
  const doDislike = () => {
    dislike(item.productId)
    registerSwipe()
    flash('nope')
  }
  const addCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    addToCart(item.productId, product.sizes[0], product.colors[0]?.name ?? '')
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    flyToCart(product.images[0], r.left + r.width / 2, r.top + r.height / 2)
    showToast('Добавлено в выбранное')
  }
  const leaveLead = (e: React.MouseEvent) => {
    e.stopPropagation()
    useStore.getState().buyNow(item.productId, product.sizes[0], product.colors[0]?.name ?? '', 'discovery')
  }

  const startPress = () => {
    dragged.current = false
    pressTimer.current = window.setTimeout(() => openProduct(item.productId), 480)
  }
  const endPress = () => {
    if (pressTimer.current) window.clearTimeout(pressTimer.current)
  }

  return (
    <section className="relative h-full w-full snap-start snap-always overflow-hidden">
      <motion.div
        className="absolute inset-0"
        style={{ x, rotate }}
        drag="x"
        dragSnapToOrigin
        dragElastic={0.55}
        dragConstraints={{ left: 0, right: 0 }}
        onDragStart={() => {
          dragged.current = true
          endPress()
        }}
        onDragEnd={(_, info) => {
          if (info.offset.x > 110) doLike()
          else if (info.offset.x < -110) doDislike()
        }}
        onPointerDown={startPress}
        onPointerUp={endPress}
        onPointerCancel={endPress}
        onDoubleClick={doubleTapLike}
      >
        <FeedMedia item={item} fallbackLabel={product.title} active={active} playing={playing} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-black/20" />

        <motion.div
          style={{ opacity: likeOpacity }}
          className="pointer-events-none absolute left-6 top-28 -rotate-[10deg] rounded-2xl border-[3px] border-magenta px-4 py-1 text-3xl font-extrabold tracking-tight text-magenta"
        >
          LIKE
        </motion.div>
        <motion.div
          style={{ opacity: nopeOpacity }}
          className="pointer-events-none absolute right-6 top-28 rotate-[10deg] rounded-2xl border-[3px] border-white px-4 py-1 text-3xl font-extrabold tracking-tight text-white"
        >
          NOPE
        </motion.div>
      </motion.div>

      {/* like/dislike burst */}
      <AnimatePresence>
        {(overlay || tapHeart) && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.3, opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
          >
            <div
              className={`flex h-24 w-24 items-center justify-center rounded-full ${
                overlay === 'like' || tapHeart ? 'bg-magenta shadow-glow' : 'glass-dark'
              } text-white`}
            >
              <Icon name={overlay === 'like' || tapHeart ? 'heartFill' : 'close'} size={54} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* mute toggle — только для видео */}
      {item.type === 'video' && (
        <button
          onClick={toggleMute}
          aria-label={videoMuted ? 'Включить звук' : 'Выключить звук'}
          className="absolute right-3 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 glass-dark text-white active:scale-90"
          style={{ top: 'calc(env(safe-area-inset-top,0px) + 56px)' }}
        >
          <Icon name={videoMuted ? 'volumeOff' : 'volume'} size={20} />
        </button>
      )}

      {/* right action rail (TikTok-style) */}
      <div className="absolute bottom-[228px] right-3 z-20 flex flex-col items-center gap-5">
        <RailBtn icon={liked ? 'heartFill' : 'heart'} label={compact(item.likes + (liked ? 1 : 0))} active={liked} onClick={doLike} />
        <RailBtn icon="comment" label={compact(item.comments)} onClick={() => setReviewsOpen(true)} />
        <RailBtn icon="share" label={compact(item.shares)} onClick={onShare} />
      </div>

      {/* bottom: caption + dark product island */}
      <div
        className="absolute inset-x-0 bottom-0 z-20 px-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 92px)' }}
      >
        <div className="mb-3 max-w-[86%] text-white">
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-white/85">
            <button onClick={() => openStore(product.brand)} className="flex items-center gap-1 font-bold active:scale-95">
              <Icon name="store" size={12} /> {product.brand}
            </button>
            <span className="h-1 w-1 rounded-full bg-white/40" />
            <span className="flex items-center gap-1">
              <Icon name="starFill" size={11} className="text-magenta" /> {product.rating.toFixed(1)}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold leading-[1.12] tracking-tight text-balance">
            {item.title}
          </h2>
        </div>

        <div className="flex items-center gap-3 rounded-[24px] border border-white/10 glass-dark p-2">
          <button
            onClick={() => openProduct(item.productId)}
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
          >
            <Img
              src={product.images[0]}
              alt={product.title}
              fallbackLabel=""
              className="h-12 w-12 flex-shrink-0 rounded-2xl object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold leading-tight text-white">{product.title}</div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold tabular text-white">{tenge(product.price)}</span>
                <span className="truncate text-xs text-white/50">{product.sellerName}</span>
              </div>
            </div>
          </button>
          <button
            onClick={leaveLead}
            className="flex h-11 flex-shrink-0 items-center justify-center rounded-full bg-magenta px-4 text-xs font-extrabold text-white transition active:scale-90"
          >
            Оставить заявку
          </button>
          <button
            onClick={addCart}
            aria-label="В выбранное"
            className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-white transition active:scale-90 ${
              inCart ? 'bg-[#8B5CFF]' : 'bg-white/10'
            }`}
          >
            <Icon name={inCart ? 'check' : 'bag'} size={20} />
          </button>
        </div>
      </div>

      <ReviewsSheet product={product} open={reviewsOpen} onClose={() => setReviewsOpen(false)} />
    </section>
  )
}

function FeedMedia({
  item,
  fallbackLabel,
  active,
  playing,
}: {
  item: FeedItem
  fallbackLabel: string
  active: boolean
  playing: boolean
}) {
  const muted = useStore((s) => s.videoMuted)
  const [videoFailed, setVideoFailed] = useState(false)
  const ref = useRef<HTMLVideoElement>(null)
  const isVideo = item.type === 'video' && !videoFailed

  // Только видимое видео играет и звучит. Остальные на паузе и без звука —
  // как в TikTok: один источник звука, нет наложения и фриза.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.muted = playing ? muted : true
    if (playing) {
      const p = el.play()
      if (p && typeof p.catch === 'function') p.catch(() => {})
    } else {
      el.pause()
      // сброс к началу, чтобы при возврате показывался первый кадр
      if (!active) {
        try {
          el.currentTime = 0
        } catch {
          /* ignore */
        }
      }
    }
  }, [playing, active, muted])

  if (isVideo) {
    return (
      <video
        ref={ref}
        // грузим только активное и соседние — не качаем все видео сразу
        src={active ? item.mediaUrl : undefined}
        poster={item.poster && !/\.(mp4|webm|mov)/i.test(item.poster) ? item.poster : undefined}
        className="h-full w-full select-none bg-black object-cover"
        loop
        playsInline
        preload={playing ? 'auto' : 'metadata'}
        onError={() => setVideoFailed(true)}
      />
    )
  }
  return (
    <Img
      src={item.poster ?? item.mediaUrl}
      alt={item.title}
      fallbackLabel={fallbackLabel}
      className="h-full w-full select-none object-cover"
    />
  )
}

function RailBtn({
  icon,
  label,
  onClick,
  active,
}: {
  icon: Parameters<typeof Icon>[0]['name']
  label: string
  onClick: (e: React.MouseEvent) => void
  active?: boolean
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 active:scale-90" aria-label={label}>
      <span className={active ? 'text-magenta drop-shadow' : 'text-white drop-shadow'}>
        <Icon name={icon} size={29} />
      </span>
      <span className="text-[11px] font-semibold text-white drop-shadow">{label}</span>
    </button>
  )
}
