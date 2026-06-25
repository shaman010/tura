import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Icon } from './Icon'
import { Img } from './Img'
import { BackButton } from './BackButton'
import { useStore } from '../store/useStore'
import { BRANDS, productsByBrand } from '../data/products'
import { tenge, compact } from '../lib/format'
import { botReply, sellerGreeting, QUICK_REPLIES } from '../lib/sellerBot'

// стабильное «число подписчиков» на бренд
function followers(brand: string) {
  let h = 0
  for (let i = 0; i < brand.length; i++) h = (h * 31 + brand.charCodeAt(i)) >>> 0
  return 12000 + (h % 88000)
}

export function BrandStore() {
  const brand = useStore((s) => s.storeBrand)
  return <AnimatePresence>{brand && <StorePanel key={brand} brand={brand} />}</AnimatePresence>
}

function StorePanel({ brand }: { brand: string }) {
  const close = useStore((s) => s.closeStore)
  const openProduct = useStore((s) => s.openProduct)
  const subscribed = useStore((s) => s.user.subscribedBrands.includes(brand))
  const toggleSubscribe = useStore((s) => s.toggleSubscribe)
  const products = productsByBrand(brand)
  const info = BRANDS.find((b) => b.name === brand)
  const [chatOpen, setChatOpen] = useState(false)
  const subs = followers(brand) + (subscribed ? 1 : 0)

  return (
    <motion.div
      className="fixed inset-0 z-[85] flex justify-center bg-base"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="no-scrollbar relative h-full w-full max-w-[480px] overflow-y-auto pb-24 text-ink">
        {/* header (без перекрывающего фото) */}
        <div className="px-5" style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 16px)' }}>
          <BackButton onClick={close} />

          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-[68px] w-[68px] flex-shrink-0 items-center justify-center rounded-3xl bg-grad-accent text-2xl font-extrabold text-white">
              {brand[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h1 className="truncate text-2xl font-extrabold tracking-tight">{brand}</h1>
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-electric text-ink">
                  <Icon name="check" size={12} />
                </span>
              </div>
              <p className="truncate text-xs text-muted">Официальный магазин · {info?.tagline}</p>
            </div>
          </div>

          {/* stats */}
          <div className="mt-3 flex gap-5 text-sm">
            <span><b className="tabular">{products.length}</b> <span className="text-muted">товаров</span></span>
            <span><b className="tabular">{compact(subs)}</b> <span className="text-muted">подписчиков</span></span>
            <span className="flex items-center gap-1"><Icon name="starFill" size={13} className="text-magenta" /> <b>4.9</b></span>
          </div>

          {/* actions */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => toggleSubscribe(brand)}
              className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl font-bold transition active:scale-[0.98] ${
                subscribed ? 'border border-ink/15 text-ink' : 'bg-grad-accent text-ink shadow-glow'
              }`}
            >
              {subscribed ? (
                <><Icon name="check" size={18} /> Вы подписаны</>
              ) : (
                <><Icon name="plus" size={18} /> Подписаться</>
              )}
            </button>
            <button
              onClick={() => setChatOpen(true)}
              className="flex h-12 flex-shrink-0 items-center justify-center gap-2 rounded-2xl border border-ink/15 px-5 font-bold active:scale-[0.98]"
            >
              <Icon name="comment" size={18} /> Чат
            </button>
          </div>
        </div>

        {/* products grid */}
        <div className="mt-5 grid grid-cols-2 gap-3 px-4">
          {products.map((p) => (
            <button key={p.id} onClick={() => openProduct(p.id)} className="text-left active:scale-[0.98]">
              <div className="relative aspect-[3/4] overflow-hidden rounded-3xl border border-ink/10">
                <Img src={p.images[0]} alt={p.title} fallbackLabel={p.title} className="h-full w-full object-cover" />
                {p.oldPrice && (
                  <span className="absolute left-2 top-2 rounded-full bg-magenta px-2 py-0.5 text-[11px] font-bold text-ink">SALE</span>
                )}
              </div>
              <div className="mt-2 px-0.5">
                <div className="truncate text-sm font-bold">{p.title}</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold tabular">{tenge(p.price)}</span>
                  {p.oldPrice && <span className="text-xs text-muted line-through tabular">{tenge(p.oldPrice)}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <SellerChat brand={brand} open={chatOpen} onClose={() => setChatOpen(false)} />
    </motion.div>
  )
}

interface Msg {
  from: 'bot' | 'me'
  text: string
}

function SellerChat({ brand, open, onClose }: { brand: string; open: boolean; onClose: () => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && msgs.length === 0) setMsgs([{ from: 'bot', text: sellerGreeting(brand) }])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  const send = (value?: string) => {
    const q = (value ?? text).trim()
    if (!q) return
    setText('')
    setMsgs((m) => [...m, { from: 'me', text: q }])
    window.setTimeout(() => setMsgs((m) => [...m, { from: 'bot', text: botReply(q, brand) }]), 500)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[95] flex justify-center bg-base text-ink"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative flex h-full w-full max-w-[480px] flex-col">
            {/* header */}
            <div
              className="flex items-center gap-3 border-b border-ink/10 px-4 pb-3"
              style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 14px)' }}
            >
              <BackButton onClick={onClose} />
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-grad-accent text-sm font-extrabold text-white">{brand[0]}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-sm font-bold">
                  {brand}
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-electric text-ink"><Icon name="check" size={10} /></span>
                </div>
                <div className="flex items-center gap-1 text-xs text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> ИИ-ассистент · онлайн
                </div>
              </div>
            </div>

            {/* messages */}
            <div className="no-scrollbar flex-1 space-y-2 overflow-y-auto px-4 py-4">
              {msgs.map((m, i) => (
                <div key={i} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-3xl px-4 py-2.5 text-[15px] leading-snug ${
                      m.from === 'me' ? 'bg-grad-accent text-ink' : 'bg-ink/[0.06] text-ink'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>

            {/* input */}
            <div
              className="border-t border-ink/10 px-4 pt-3"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 12px)' }}
            >
              <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto">
                {QUICK_REPLIES.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="flex-shrink-0 rounded-full bg-ink/[0.06] px-3 py-1.5 text-xs font-semibold text-ink/80 active:scale-95"
                  >
                    {q}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && send()}
                  placeholder="Спросите ассистента…"
                  className="h-11 flex-1 rounded-full bg-ink/[0.06] px-4 text-[15px] text-ink outline-none focus:ring-2 focus:ring-magenta/40"
                />
                <button
                  onClick={() => send()}
                  aria-label="Отправить"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-grad-accent text-ink"
                >
                  <Icon name="arrowUp" size={20} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
