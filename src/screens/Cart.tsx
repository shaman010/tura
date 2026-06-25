import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Icon } from '../components/Icon'
import { Img } from '../components/Img'
import { BottomSheet } from '../components/BottomSheet'
import { useStore } from '../store/useStore'
import { productById } from '../data/products'
import { tenge } from '../lib/format'
import { track } from '../lib/analytics'
import type { CartItem, Product } from '../types'

export function Cart() {
  const cart = useStore((s) => s.user.cart)
  const removeFromCart = useStore((s) => s.removeFromCart)
  const setQty = useStore((s) => s.setQty)
  const toggleSelected = useStore((s) => s.toggleCartSelected)
  const selectAll = useStore((s) => s.selectAllCart)
  const save = useStore((s) => s.save)
  const openCheckout = useStore((s) => s.openCheckout)
  const openProduct = useStore((s) => s.openProduct)
  const setTab = useStore((s) => s.setTab)
  const showToast = useStore((s) => s.showToast)

  const [selectMode, setSelectMode] = useState(false)
  const [variantFor, setVariantFor] = useState<{ item: CartItem; product: Product } | null>(null)

  const selected = cart.filter((c) => c.selected)
  const selectedTotal = selected.reduce((sum, c) => {
    const p = productById(c.productId)
    return sum + (p ? p.price * c.quantity : 0)
  }, 0)
  const allTotal = cart.reduce((sum, c) => {
    const p = productById(c.productId)
    return sum + (p ? p.price * c.quantity : 0)
  }, 0)

  if (cart.length === 0) {
    return (
      <Screen>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border border-ink/10 bg-ink/[0.04] text-ink/70">
            <Icon name="bag" size={38} />
          </div>
          <h2 className="text-xl font-extrabold">Выбранное пусто</h2>
          <p className="max-w-[260px] text-sm text-muted">Свайпайте понравившиеся образы и добавляйте их в выбранное.</p>
          <button
            onClick={() => setTab('discovery')}
            className="mt-3 flex h-12 items-center gap-2 rounded-2xl bg-grad-accent px-6 font-bold text-ink shadow-glow active:scale-[0.98]"
          >
            <Icon name="spark" size={18} /> Перейти в Дискавери
          </button>
        </div>
      </Screen>
    )
  }

  return (
    <Screen>
      <div
        className="flex items-center justify-between px-5 pb-2"
        style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 16px)' }}
      >
        <div>
          <h1 className="font-display text-2xl font-extrabold">Выбранное</h1>
          <p className="text-xs text-muted">{cart.length} товара · {tenge(allTotal)}</p>
        </div>
        <button
          onClick={() => {
            setSelectMode((v) => !v)
            if (!selectMode) {
              selectAll(true)
              track('cart_select_mode_enabled', { items: cart.length })
            }
          }}
          className={`rounded-full px-4 py-2 text-sm font-bold transition ${
            selectMode ? 'bg-ink text-card' : 'bg-surface text-ink'
          }`}
        >
          {selectMode ? 'Готово' : 'Выбрать'}
        </button>
      </div>

      {selectMode && (
        <div className="flex items-center gap-3 px-5 pb-2 text-sm">
          <button onClick={() => selectAll(true)} className="font-semibold text-electric">
            Выбрать все
          </button>
          <button onClick={() => selectAll(false)} className="font-semibold text-muted">
            Снять выбор
          </button>
          <span className="ml-auto font-bold text-magenta">{selected.length} выбрано</span>
        </div>
      )}

      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto px-4 pb-40 pt-1">
        {cart.map((item) => {
          const p = productById(item.productId)
          if (!p) return null
          return (
            <motion.div
              key={item.productId + item.selectedSize + item.selectedColor}
              layout
              className={`relative flex gap-3 rounded-3xl border bg-ink/[0.04] p-2.5 transition ${
                selectMode && item.selected ? 'border-magenta shadow-glow' : 'border-ink/10'
              }`}
            >
              {selectMode && (
                <button
                  onClick={() => {
                    toggleSelected(item.productId)
                    track('cart_item_selected', { productId: item.productId })
                  }}
                  aria-label="Выбрать товар"
                  className={`absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 transition ${
                    item.selected ? 'border-magenta bg-magenta text-ink' : 'border-ink/30'
                  }`}
                >
                  {item.selected && <Icon name="check" size={16} />}
                </button>
              )}
              <button onClick={() => openProduct(p.id)} className="flex-shrink-0">
                <Img
                  src={p.images[0]}
                  alt={p.title}
                  fallbackLabel=""
                  className="h-24 w-20 rounded-2xl object-cover"
                />
              </button>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="text-xs font-bold uppercase tracking-wide text-magenta">{p.brand}</div>
                <div className="truncate text-sm font-bold">{p.title}</div>
                <button
                  onClick={() => setVariantFor({ item, product: p })}
                  className="mt-1 flex w-fit items-center gap-2 rounded-full bg-surface px-2.5 py-1 text-xs font-semibold"
                >
                  <span>{item.selectedSize}</span>
                  <span className="text-muted">·</span>
                  <span>{item.selectedColor}</span>
                  <Icon name="chevronDown" size={13} className="text-muted" />
                </button>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 rounded-full bg-surface px-1.5 py-1">
                    <button
                      onClick={() => setQty(item.productId, item.quantity - 1)}
                      aria-label="Меньше"
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-ink/10"
                    >
                      <Icon name="minus" size={15} />
                    </button>
                    <span className="w-5 text-center text-sm font-bold tabular">{item.quantity}</span>
                    <button
                      onClick={() => setQty(item.productId, item.quantity + 1)}
                      aria-label="Больше"
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-ink/10"
                    >
                      <Icon name="plus" size={15} />
                    </button>
                  </div>
                  <span className="text-sm font-extrabold tabular">{tenge(p.price * item.quantity)}</span>
                </div>
              </div>
              {!selectMode && (
                <button
                  onClick={() => removeFromCart(item.productId)}
                  aria-label="Удалить"
                  className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full text-muted hover:text-magenta"
                >
                  <Icon name="trash" size={17} />
                </button>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* bottom bar */}
      <div
        className="absolute inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-base/95 px-4 pt-3 backdrop-blur-xl"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 84px)' }}
      >
        <AnimatePresence mode="wait">
          {selectMode ? (
            <motion.div
              key="actionbar"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="flex items-center gap-2"
            >
              <button
                onClick={() => {
                  selected.forEach((c) => save(c.productId))
                  showToast('Сохранено в избранное')
                }}
                disabled={selected.length === 0}
                className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-surface text-sm font-bold disabled:opacity-40"
              >
                <Icon name="heart" size={18} /> В избранное
              </button>
              <button
                onClick={() => {
                  selected.forEach((c) => removeFromCart(c.productId))
                  showToast('Удалено')
                }}
                disabled={selected.length === 0}
                className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-surface text-sm font-bold text-magenta disabled:opacity-40"
              >
                <Icon name="trash" size={18} /> Удалить
              </button>
              <button
                onClick={() => openCheckout(selected.map((c) => c.productId), 'cart')}
                disabled={selected.length === 0}
                className="flex h-12 flex-[1.4] items-center justify-center gap-1.5 rounded-2xl bg-magenta text-sm font-bold text-ink shadow-glow disabled:opacity-40"
              >
                <Icon name="bolt" size={18} /> Заявка ({selected.length})
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="checkout"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              onClick={() => openCheckout(cart.map((c) => c.productId), 'cart')}
              className="flex h-14 w-full items-center justify-between rounded-2xl bg-magenta px-5 font-bold text-ink shadow-glow"
            >
              <span>Отправить заявку</span>
              <span className="tabular">{tenge(allTotal)}</span>
            </motion.button>
          )}
        </AnimatePresence>
        {selectMode && (
          <div className="mt-2 text-center text-sm font-semibold text-muted">
            Выбрано на <span className="text-ink tabular">{tenge(selectedTotal)}</span>
          </div>
        )}
      </div>

      {/* variant editor */}
      <BottomSheet open={!!variantFor} onClose={() => setVariantFor(null)} label="Размер и цвет">
        {variantFor && (
          <VariantEditor
            item={variantFor.item}
            product={variantFor.product}
            onClose={() => setVariantFor(null)}
          />
        )}
      </BottomSheet>
    </Screen>
  )
}

function VariantEditor({
  item,
  product,
  onClose,
}: {
  item: CartItem
  product: Product
  onClose: () => void
}) {
  const update = useStore((s) => s.updateCartVariant)
  const [size, setSize] = useState(item.selectedSize)
  const [color, setColor] = useState(item.selectedColor)
  return (
    <div className="px-5 pb-8 pt-2">
      <h3 className="mb-4 text-lg font-bold">{product.title}</h3>
      <div className="mb-2 text-sm font-semibold">Размер</div>
      <div className="mb-4 flex flex-wrap gap-2">
        {product.sizes.map((sz) => (
          <button
            key={sz}
            onClick={() => setSize(sz)}
            className={`min-w-[48px] rounded-2xl px-3 py-2.5 text-sm font-bold ${
              size === sz ? 'bg-ink text-card' : 'bg-surface'
            }`}
          >
            {sz}
          </button>
        ))}
      </div>
      <div className="mb-2 text-sm font-semibold">Цвет: {color}</div>
      <div className="mb-6 flex gap-2.5">
        {product.colors.map((c) => (
          <button
            key={c.name}
            onClick={() => setColor(c.name)}
            aria-label={c.name}
            className={`h-9 w-9 rounded-full border-2 ${color === c.name ? 'border-magenta' : 'border-ink/10'}`}
            style={{ background: c.hex }}
          />
        ))}
      </div>
      <button
        onClick={() => {
          update(item.productId, size, color)
          onClose()
        }}
        className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-magenta py-3.5 font-bold text-ink shadow-glow"
      >
        <Icon name="check" size={20} /> Применить
      </button>
    </div>
  )
}

function Screen({ children }: { children: React.ReactNode }) {
  return <div className="relative flex h-full w-full max-w-[480px] flex-col bg-base">{children}</div>
}

