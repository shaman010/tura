import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Icon } from './Icon'
import { Img } from './Img'
import { BackButton } from './BackButton'
import { ReviewsSheet } from './ReviewsSheet'
import { useStore } from '../store/useStore'
import { productById } from '../data/products'
import { useRuntimeCatalog } from '../lib/cms'
import { tenge } from '../lib/format'
import { recommendedSize } from '../lib/recommendations'

interface Props {
  productId: string
  onBack: () => void
  onSelect: (id: string) => void
}

/**
 * Pinterest-style full-screen открытие товара из Search.
 * Не bottom-sheet: занимает весь экран, фото с zoom-эффектом, кнопка «назад»
 * слева сверху. Dark premium стиль.
 */
export function FullscreenProductDetail({ productId, onBack, onSelect }: Props) {
  const product = productById(productId)
  const { products } = useRuntimeCatalog()
  const sizes = useStore((s) => s.user.sizes)
  const saved = useStore((s) => s.user.savedProducts.includes(productId))
  const addToCart = useStore((s) => s.addToCart)
  const buyNow = useStore((s) => s.buyNow)
  const toggleSave = useStore((s) => s.toggleSave)
  const openProduct = useStore((s) => s.openProduct)
  const showToast = useStore((s) => s.showToast)
  const flyToCart = useStore((s) => s.flyToCart)
  const openStore = useStore((s) => s.openStore)

  const recommended = useMemo(
    () => (product ? recommendedSize(sizes, product.sizes) : null),
    [sizes, product],
  )
  const [reviewsOpen, setReviewsOpen] = useState(false)
  const [color, setColor] = useState(product?.colors[0]?.name ?? '')
  const [size, setSize] = useState<string>(recommended ?? product?.sizes[0] ?? '')

  const similar = useMemo(() => {
    if (!product) return []
    return products.filter(
      (p) => p.id !== product.id && (p.category === product.category || p.styleTags.some((t) => product.styleTags.includes(t))),
    ).slice(0, 6)
  }, [product, products])

  if (!product) return null

  const onCart = (e: React.MouseEvent) => {
    addToCart(product.id, size, color)
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    flyToCart(product.images[0], r.left + r.width / 2, r.top + r.height / 2)
    showToast('Добавлено в выбранное')
  }
  const onShare = async () => {
    try {
      const url = `${window.location.origin}/product/${product.id}`
      if (navigator.share) await navigator.share({ title: product.title, text: product.description, url })
      else {
        await navigator.clipboard?.writeText(url)
        showToast('Ссылка на товар скопирована')
      }
    } catch {
      /* отменено */
    }
  }
  const messageSeller = () => {
    const text = encodeURIComponent(`Здравствуйте! Хочу уточнить наличие: ${product.title} ${window.location.origin}/product/${product.id}`)
    if (product.sellerWhatsApp) window.open(`https://wa.me/${product.sellerWhatsApp.replace(/\D/g, '')}?text=${text}`, '_blank')
    else showToast('Контакт продавца появится после заявки')
  }

  return (
    <motion.div
      className="media-dark fixed inset-0 z-[80] flex justify-center bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="no-scrollbar relative h-full w-full max-w-[480px] overflow-y-auto pb-32 text-white">
        {/* image — плавный shared-element morph из грид-карточки */}
        <div className="relative px-3" style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 8px)' }}>
          <motion.div
            layoutId={`pin-${product.id}`}
            transition={{ type: 'spring', stiffness: 240, damping: 30, mass: 0.9 }}
            className="aspect-[3/4] w-full overflow-hidden rounded-[28px] bg-night"
          >
            <Img
              src={product.images[0]}
              alt={product.title}
              fallbackLabel={product.title}
              className="h-full w-full object-cover"
            />
          </motion.div>

          {/* back button — гласс как меню */}
          <BackButton
            onClick={onBack}
            className="absolute left-5"
            style={{ top: 'calc(env(safe-area-inset-top,0px) + 18px)' }}
          />
        </div>

        {/* action row */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
          className="mt-4 flex items-center gap-2 px-4"
        >
          <ActionPill icon={saved ? 'bookmarkFill' : 'bookmark'} active={saved} onClick={() => toggleSave(product.id)} />
          <ActionPill icon="comment" onClick={() => setReviewsOpen(true)} />
          <ActionPill icon="share" onClick={onShare} />
          <ActionPill icon="sparkles" onClick={() => openProduct(product.id)} />
          <button
            onClick={onCart}
            className="ml-auto flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-grad-accent font-bold text-white shadow-glow active:scale-[0.98]"
          >
            <Icon name="bag" size={19} /> В выбранное
          </button>
        </motion.div>

        {/* info */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
          className="space-y-5 px-5 pt-5"
        >
          <div>
            <button
              onClick={() => {
                onBack()
                openStore(product.brand)
              }}
              className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-magenta active:scale-95"
            >
              <Icon name="store" size={13} /> {product.sellerName}
              <Icon name="chevronRight" size={13} className="text-magenta/60" />
            </button>
            <h1 className="mt-1 text-2xl font-extrabold leading-tight">{product.title}</h1>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-2xl font-extrabold tabular">{tenge(product.price)}</span>
              {product.oldPrice && (
                <span className="text-base text-muted line-through tabular">{tenge(product.oldPrice)}</span>
              )}
              <span className="ml-auto flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-sm font-bold">
                <Icon name="starFill" size={14} className="text-magenta" />
                {product.rating.toFixed(1)}
              </span>
            </div>
          </div>

          {/* color — блок */}
          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-bold">Цвет</span>
              <span className="text-xs text-muted">{color}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((c) => {
                const active = color === c.name
                return (
                  <button
                    key={c.name}
                    onClick={() => setColor(c.name)}
                    className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
                      active ? 'border-magenta bg-magenta/10' : 'border-white/10 bg-white/[0.03]'
                    }`}
                  >
                    <span className="h-5 w-5 rounded-full border border-white/20" style={{ background: c.hex }} />
                    {c.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* size — блок */}
          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-sm font-bold">Размер</span>
              {recommended && (
                <span className="flex items-center gap-1 rounded-full bg-electric/15 px-2.5 py-1 text-xs font-bold text-electric">
                  <Icon name="sparkles" size={13} /> Рекомендуем {recommended}
                </span>
              )}
            </div>
            <div className="grid grid-cols-5 gap-2">
              {product.sizes.map((sz) => {
                const active = size === sz
                return (
                  <button
                    key={sz}
                    onClick={() => setSize(sz)}
                    className={`flex h-11 items-center justify-center rounded-2xl border text-sm font-bold transition ${
                      active ? 'border-magenta bg-white text-black' : 'border-white/10 bg-white/[0.03] text-white'
                    }`}
                  >
                    {sz}
                  </button>
                )
              })}
            </div>
          </div>

          <p className="text-[15px] leading-relaxed text-white/70">{product.description}</p>

          {/* CTAs */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                buyNow(product.id, size, color, 'search')
                onBack()
              }}
              className="flex h-13 flex-shrink-0 items-center justify-center gap-2 rounded-2xl bg-white/[0.06] px-4 font-bold text-white active:scale-[0.98]"
            >
              <Icon name="send" size={20} /> Оставить заявку
            </button>
            <button
              onClick={messageSeller}
              className="flex h-13 flex-1 items-center justify-center gap-2 rounded-2xl border border-white/15 font-bold text-white active:scale-[0.98]"
            >
              <Icon name="phone" size={19} /> Написать продавцу
            </button>
          </div>

          {/* similar */}
          {similar.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-bold">Другие интересные образы</h3>
              <div className="grid grid-cols-2 gap-3">
                {similar.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onSelect(p.id)}
                    className="relative overflow-hidden rounded-3xl text-left active:scale-[0.98]"
                  >
                    <Img src={p.images[0]} alt={p.title} fallbackLabel={p.title} className="aspect-[3/4] w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-2 left-3 right-3">
                      <div className="truncate text-sm font-bold">{p.title}</div>
                      <div className="truncate text-xs text-white/60">{p.brand}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <ReviewsSheet product={product} open={reviewsOpen} onClose={() => setReviewsOpen(false)} />
    </motion.div>
  )
}

function ActionPill({
  icon,
  onClick,
  active,
}: {
  icon: Parameters<typeof Icon>[0]['name']
  onClick: () => void
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      aria-label="Действие"
      className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] active:scale-90 ${
        active ? 'text-magenta' : 'text-white'
      }`}
    >
      <Icon name={icon} size={20} />
    </button>
  )
}
