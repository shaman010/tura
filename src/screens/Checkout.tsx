import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Icon } from '../components/Icon'
import { Img } from '../components/Img'
import { BackButton } from '../components/BackButton'
import { useStore } from '../store/useStore'
import { productById } from '../data/products'
import { tenge } from '../lib/format'

export function Checkout() {
  const open = useStore((s) => s.checkoutOpen)
  const close = useStore((s) => s.closeCheckout)
  const ids = useStore((s) => s.checkoutItemIds)
  const source = useStore((s) => s.checkoutSource)
  const cart = useStore((s) => s.user.cart)
  const submitLead = useStore((s) => s.submitLead)

  const items = cart.filter((c) => ids.includes(c.productId))
  const total = items.reduce((sum, c) => {
    const p = productById(c.productId)
    return sum + (p ? p.price * c.quantity : 0)
  }, 0)
  const sellerCount = useMemo(() => {
    const sellers = new Set(items.map((item) => productById(item.productId)?.sellerId).filter(Boolean))
    return sellers.size
  }, [items])

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [comment, setComment] = useState('')
  const [placing, setPlacing] = useState(false)
  const [successCount, setSuccessCount] = useState(0)

  const reset = () => {
    setName('')
    setPhone('')
    setCity('')
    setComment('')
    setPlacing(false)
    setSuccessCount(0)
  }

  const close2 = () => {
    close()
    window.setTimeout(reset, 300)
  }

  const canSubmit = name.trim().length > 1 && phone.trim().length >= 6 && city.trim().length > 1 && items.length > 0

  const onSubmit = () => {
    if (!canSubmit || placing) return
    setPlacing(true)
    window.setTimeout(() => {
      const leads = submitLead(ids, {
        source,
        customer: { name: name.trim(), phone: phone.trim(), city: city.trim(), comment: comment.trim() },
      })
      setSuccessCount(leads.length)
      setPlacing(false)
    }, 450)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[95] flex justify-center bg-black/40"
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
            <div
              className="border-b border-ink/10 px-5 pb-4"
              style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 16px)' }}
            >
              <div className="flex items-center justify-between">
                <BackButton onClick={close2} icon="close" />
                <h2 className="font-display text-lg font-extrabold">Заявка продавцу</h2>
                <div className="w-10" />
              </div>
              <p className="mt-2 text-center text-xs text-muted">
                Оплату, наличие и доставку продавец подтвердит после заявки.
              </p>
            </div>

            <div className="no-scrollbar flex-1 overflow-y-auto px-5 py-4">
              {successCount ? (
                <Success count={successCount} onClose={close2} />
              ) : (
                <div className="space-y-4">
                  <LeadSummary ids={ids} total={total} />
                  {sellerCount > 1 && (
                    <div className="rounded-2xl border border-magenta/25 bg-magenta/10 p-3 text-sm text-ink/85">
                      В выбранном товары от разных продавцов. Мы отправим отдельные заявки каждому продавцу.
                    </div>
                  )}
                  <Field label="Имя" value={name} onChange={setName} placeholder="Как к вам обращаться" autoComplete="name" />
                  <Field
                    label="Телефон / WhatsApp"
                    value={phone}
                    onChange={setPhone}
                    placeholder="+7 ___ ___ __ __"
                    type="tel"
                    autoComplete="tel"
                  />
                  <Field label="Город" value={city} onChange={setCity} placeholder="Алматы" autoComplete="address-level2" />
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-muted">Комментарий</span>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Например: напишите в WhatsApp, нужна примерка, уточните наличие"
                      className="min-h-[92px] rounded-2xl bg-surface px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-magenta/40"
                    />
                  </label>
                </div>
              )}
            </div>

            {!successCount && (
              <div
                className="border-t border-ink/10 px-5 pt-3"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 14px)' }}
              >
                <button
                  onClick={onSubmit}
                  disabled={!canSubmit || placing}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-grad-accent font-bold text-ink shadow-glow transition active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
                >
                  {placing ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-ink/40 border-t-white" />
                      Отправляем...
                    </>
                  ) : (
                    <>
                      <Icon name="send" size={20} /> Отправить заявку продавцу
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  autoComplete,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  autoComplete?: string
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-muted">{label}</span>
      <input
        type={type}
        inputMode={type === 'tel' ? 'tel' : undefined}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-13 rounded-2xl bg-surface px-4 text-[15px] outline-none focus:ring-2 focus:ring-magenta/40"
      />
    </label>
  )
}

function LeadSummary({ ids, total }: { ids: string[]; total: number }) {
  const cart = useStore((s) => s.user.cart).filter((c) => ids.includes(c.productId))
  return (
    <div className="rounded-3xl bg-surface p-4">
      <h4 className="mb-3 text-sm font-bold">Выбранные товары</h4>
      <div className="space-y-2">
        {cart.map((c) => {
          const p = productById(c.productId)
          if (!p) return null
          return (
            <div key={c.productId + c.selectedSize + c.selectedColor} className="flex items-center gap-3">
              <Img src={p.images[0]} alt={p.title} fallbackLabel="" className="h-12 w-10 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{p.title}</div>
                <div className="text-xs text-muted">
                  {p.sellerName} · {c.selectedSize} · {c.selectedColor} · {c.quantity} шт
                </div>
              </div>
              <span className="text-sm font-bold tabular">{tenge(p.price * c.quantity)}</span>
            </div>
          )
        })}
      </div>
      <div className="mt-3 flex justify-between border-t border-ink/10 pt-3 text-sm font-extrabold">
        <span>Сумма витрины</span>
        <span className="tabular">{tenge(total)}</span>
      </div>
    </div>
  )
}

function Success({ count, onClose }: { count: number; onClose: () => void }) {
  const setTab = useStore((s) => s.setTab)
  const goToAccountSection = useStore((s) => s.goToAccountSection)
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        className="flex h-24 w-24 items-center justify-center rounded-full bg-grad-accent text-ink shadow-glow"
      >
        <Icon name="check" size={48} />
      </motion.div>
      <h2 className="mt-6 text-2xl font-extrabold">
        {count > 1 ? 'Заявки отправлены продавцам' : 'Заявка отправлена продавцу'}
      </h2>
      <p className="mt-2 max-w-[310px] text-sm text-muted">
        Продавец свяжется с вами для подтверждения цены, наличия и доставки.
      </p>
      <button
        onClick={() => {
          onClose()
          setTab('discovery')
        }}
        className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-grad-accent font-bold text-ink shadow-glow active:scale-[0.98]"
      >
        <Icon name="spark" size={20} /> В Discovery
      </button>
      <button
        onClick={() => {
          onClose()
          goToAccountSection('orders')
        }}
        className="mt-2 flex h-13 w-full items-center justify-center gap-2 rounded-2xl border border-ink/15 font-bold text-ink/85 active:scale-[0.98]"
      >
        <Icon name="box" size={20} /> Мои заявки
      </button>
    </div>
  )
}
