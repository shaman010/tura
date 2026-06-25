import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Icon } from './Icon'
import { Img } from './Img'
import { ReviewsSheet } from './ReviewsSheet'
import { BottomSheet } from './BottomSheet'
import { SizeFinder } from './SizeFinder'
import { useStore } from '../store/useStore'
import { productById } from '../data/products'
import { tenge } from '../lib/format'
import { recommendedSize } from '../lib/recommendations'

export function ProductDetail() {
  const id = useStore((s) => s.openProductId)
  const close = useStore((s) => s.closeProduct)
  const product = id ? productById(id) : undefined

  return (
    <AnimatePresence>
      {product && <DetailPanel key={product.id} productId={product.id} onClose={close} />}
    </AnimatePresence>
  )
}

function DetailPanel({ productId, onClose }: { productId: string; onClose: () => void }) {
  const product = productById(productId)!
  const sizes = useStore((s) => s.user.sizes)
  const saved = useStore((s) => s.user.savedProducts.includes(productId))
  const addToCart = useStore((s) => s.addToCart)
  const buyNow = useStore((s) => s.buyNow)
  const toggleSave = useStore((s) => s.toggleSave)
  const showToast = useStore((s) => s.showToast)
  const openStore = useStore((s) => s.openStore)

  const [gallery, setGallery] = useState(0)
  const [color, setColor] = useState(product.colors[0]?.name ?? '')
  const recommended = useMemo(
    () => recommendedSize(sizes, product.sizes),
    [sizes, product.sizes],
  )
  const [size, setSize] = useState<string>(recommended ?? '')
  const [reviewsOpen, setReviewsOpen] = useState(false)
  const [finderOpen, setFinderOpen] = useState(false)

  useEffect(() => {
    if (!size && recommended) setSize(recommended)
  }, [recommended, size])

  const ensureSize = () => {
    if (size) return true
    showToast('Выберите размер')
    return false
  }
  const onShare = async () => {
    const url = `${window.location.origin}/product/${product.id}`
    try {
      if (navigator.share) await navigator.share({ title: product.title, text: product.description, url })
      else {
        await navigator.clipboard?.writeText(url)
        showToast('Ссылка на товар скопирована')
      }
    } catch {
      /* cancelled */
    }
  }
  const messageSeller = () => {
    const text = encodeURIComponent(`Здравствуйте! Хочу уточнить наличие: ${product.title} ${window.location.origin}/product/${product.id}`)
    if (product.sellerWhatsApp) window.open(`https://wa.me/${product.sellerWhatsApp.replace(/\D/g, '')}?text=${text}`, '_blank')
    else showToast('Контакт продавца появится после заявки')
  }

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex justify-center bg-black/40"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="relative flex h-full w-full max-w-[480px] flex-col bg-base text-ink"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 360, damping: 36 }}
      >
        {/* header */}
        <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-4 pt-4">
          <button
            onClick={onClose}
            aria-label="Назад"
            className="flex h-10 w-10 items-center justify-center rounded-full glass shadow-soft"
          >
            <Icon name="chevronDown" size={22} />
          </button>
          <button
            onClick={() => toggleSave(productId)}
            aria-label="Сохранить"
            className="flex h-10 w-10 items-center justify-center rounded-full glass shadow-soft"
          >
            <Icon name={saved ? 'heartFill' : 'heart'} size={20} className={saved ? 'text-magenta' : ''} />
          </button>
        </div>

        <div className="no-scrollbar flex-1 overflow-y-auto pb-28">
          {/* gallery */}
          <div className="relative aspect-[4/5] w-full bg-surface">
            <Img
              src={product.images[gallery]}
              alt={product.title}
              fallbackLabel={product.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
              {product.images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setGallery(i)}
                  aria-label={`Фото ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === gallery ? 'w-6 bg-white' : 'w-1.5 bg-ink/60'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-5 px-5 pt-5">
            <div>
              <button
                onClick={() => {
                  onClose()
                  openStore(product.brand)
                }}
                className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-magenta active:scale-95"
              >
                <Icon name="store" size={13} /> {product.sellerName}
                <Icon name="chevronRight" size={13} className="text-magenta/60" />
              </button>
              <h1 className="mt-1 font-display text-2xl font-extrabold leading-tight">
                {product.title}
              </h1>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-2xl font-extrabold tabular">{tenge(product.price)}</span>
                {product.oldPrice && (
                  <span className="text-base text-muted line-through tabular">
                    {tenge(product.oldPrice)}
                  </span>
                )}
                <span className="ml-auto flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-sm font-bold">
                  <Icon name="starFill" size={14} className="text-magenta" />
                  {product.rating.toFixed(1)}
                </span>
              </div>
            </div>

            {/* colors — блочная структура */}
            <div className="rounded-[24px] border border-ink/10 bg-ink/[0.04] p-4">
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
                        active ? 'border-magenta bg-magenta/10' : 'border-ink/10 bg-ink/[0.03]'
                      }`}
                    >
                      <span className="h-5 w-5 rounded-full border border-ink/20" style={{ background: c.hex }} />
                      {c.name}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* size — блочная структура */}
            <div className="rounded-[24px] border border-ink/10 bg-ink/[0.04] p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-sm font-bold">Размер</span>
                {recommended ? (
                  <span className="flex items-center gap-1 rounded-full bg-electric/15 px-2.5 py-1 text-xs font-bold text-electric">
                    <Icon name="sparkles" size={13} /> Рекомендуем {recommended}
                  </span>
                ) : (
                  <button
                    onClick={() => setFinderOpen(true)}
                    className="flex items-center gap-1 rounded-full bg-ink/[0.06] px-2.5 py-1 text-xs font-bold text-ink"
                  >
                    <Icon name="ruler" size={13} /> Подобрать
                  </button>
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
                        active ? 'border-magenta bg-ink text-card' : 'border-ink/10 bg-ink/[0.03] text-ink'
                      }`}
                    >
                      {sz}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* description */}
            <p className="text-[15px] leading-relaxed text-ink/80">{product.description}</p>

            <div className="rounded-3xl bg-surface p-4">
              <h3 className="mb-2 text-sm font-bold">Детали</h3>
              <ul className="space-y-1.5">
                {product.details.map((d) => (
                  <li key={d} className="flex items-start gap-2 text-sm text-ink/75">
                    <Icon name="check" size={16} className="mt-0.5 text-magenta" /> {d}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={messageSeller}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-surface text-sm font-bold"
              >
                <Icon name="phone" size={18} /> Написать продавцу
              </button>
              <button
                onClick={onShare}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-surface text-sm font-bold"
              >
                <Icon name="share" size={18} /> Поделиться
              </button>
            </div>

            {/* reviews entry */}
            <button
              onClick={() => setReviewsOpen(true)}
              className="flex w-full items-center justify-between rounded-3xl bg-surface p-4 text-left"
            >
              <div>
                <div className="flex items-center gap-2">
                  <Icon name="comment" size={18} className="text-magenta" />
                <span className="text-sm font-bold">Отзывы и вопросы</span>
                </div>
                <span className="text-xs text-muted">{product.reviews.length} отзывов · фото</span>
              </div>
              <Icon name="chevronRight" size={20} className="text-muted" />
            </button>

            {/* seller confirmation */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-3xl border border-ink/10 p-4">
                <Icon name="box" size={20} className="text-electric" />
                <h4 className="mt-2 text-sm font-bold">Наличие</h4>
                <p className="mt-0.5 text-xs text-muted">{product.delivery}</p>
              </div>
              <div className="rounded-3xl border border-ink/10 p-4">
                <Icon name="arrowUp" size={20} className="text-violet" />
                <h4 className="mt-2 text-sm font-bold">Условия</h4>
                <p className="mt-0.5 text-xs text-muted">{product.returns}</p>
              </div>
            </div>
          </div>
        </div>

        {/* sticky action bar */}
        <div
          className="absolute inset-x-0 bottom-0 z-20 flex items-center gap-2 border-t border-ink/10 bg-base/95 px-4 pt-3 backdrop-blur-xl"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 12px)' }}
        >
          <button
            onClick={() => {
              if (!ensureSize()) return
              buyNow(productId, size, color, 'product_page')
            }}
            className="flex h-13 flex-shrink-0 items-center justify-center gap-2 rounded-2xl bg-surface px-4 py-3.5 font-bold text-ink"
          >
            <Icon name="send" size={20} /> Заявка
          </button>
          <button
            onClick={() => {
              if (!ensureSize()) return
              addToCart(productId, size, color)
              showToast('Добавлено в выбранное')
            }}
            className="flex h-13 flex-1 items-center justify-center gap-2 rounded-2xl bg-magenta py-3.5 font-bold text-ink shadow-glow"
          >
            <Icon name="bag" size={20} /> В выбранное
            <span className="tabular">· {tenge(product.price)}</span>
          </button>
        </div>
      </motion.div>

      <ReviewsSheet product={product} open={reviewsOpen} onClose={() => setReviewsOpen(false)} />
      <BottomSheet open={finderOpen} onClose={() => setFinderOpen(false)} label="Подбор размера">
        <div className="px-5 pb-8 pt-2">
          <h3 className="mb-1 text-lg font-bold">Поможем с размером</h3>
          <p className="mb-4 text-sm text-muted">Заполни данные — подберём размер автоматически.</p>
          <SizeFinder onDone={() => setFinderOpen(false)} compact />
        </div>
      </BottomSheet>
    </motion.div>
  )
}
