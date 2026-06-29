import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Icon } from '../components/Icon'
import { Img } from '../components/Img'
import { useStore } from '../store/useStore'
import { STYLE_LABELS, STYLE_TAGS } from '../lib/recommendations'
import { track } from '../lib/analytics'
import type { StyleTag, Fit } from '../types'

const STYLE_IMAGES: Partial<Record<StyleTag, string>> = {
  minimal: '1485462537746-965f33f7f6a7',
  streetwear: '1556905055-8f358a7a47b2',
  casual: '1521572163474-6864f9cf17ab',
  classic: '1591047139829-d91aecb6caea',
  sport: '1518611012118-696072aa579a',
  korean: '1496747611176-843222e1e57c',
  luxury: '1584917865442-de89df76afd3',
  oversize: '1620799140408-edc6dcb6d633',
  feminine: '1490481651871-ab68de25d43d',
  office: '1594938298603-c8148c4dae35',
  evening: '1515886657613-9f3515b0c78f',
  romantic: '1496747611176-843222e1e57c',
  ethno: '1529139574466-a303027c1d8b',
  modest: '1509631179647-0177331693ae',
}
const styleImg = (t: StyleTag) =>
  `https://images.unsplash.com/photo-${STYLE_IMAGES[t] ?? STYLE_IMAGES.casual}?w=400&q=75&auto=format&fit=crop`

export function Onboarding() {
  const complete = useStore((s) => s.completeOnboarding)
  const [step, setStep] = useState(0)
  const [styles, setStyles] = useState<StyleTag[]>([])

  useEffect(() => {
    track('onboarding_started')
  }, [])

  const toggle = (t: StyleTag) =>
    setStyles((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]))

  const next = () => setStep((s) => s + 1)
  const finish = () => complete(styles)
  const skip = () => {
    track('onboarding_skipped', { atStep: step })
    finish()
  }
  const done = () => {
    track('onboarding_completed', { styles: styles.length, hasSizes: !!useStore.getState().user.sizes.height })
    finish()
  }

  return (
    <div className="media-dark relative flex h-full w-full max-w-[480px] flex-col overflow-hidden bg-black text-white">
      {/* progress dots */}
      <div className="flex gap-1.5 px-6 pt-5" style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 20px)' }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all ${
              i <= step ? 'bg-magenta' : 'bg-white/15'
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && <Welcome key="w" onStart={next} onSkip={skip} />}
        {step === 1 && (
          <Styles key="s" selected={styles} toggle={toggle} onNext={next} />
        )}
        {step === 2 && <SizesStep key="z" onNext={next} />}
        {step === 3 && <Ready key="r" onGo={done} />}
      </AnimatePresence>
    </div>
  )
}

const slide = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
  transition: { duration: 0.25 },
}

// Видео локальных магазинов для «живой» витрины в онбординге
const INTRO_VIDEOS = ['/content/shoqan/v1.mp4', '/content/moonshuaq/v1.mp4', '/content/shetel/v1.mp4', '/content/goldapple/v1.mp4', '/content/shoqan/v2.mp4', '/content/goldapple/v3.mp4']

// Сюжет онбординга (УТП: видео-витрина локальных магазинов + покупка в один тап)
const STORY = [
  {
    grad: ['Покупай', 'прямо из видео'],
    accent: 0,
    sub: 'Листай реальные ролики товаров от магазинов твоего города — как в TikTok, только всё можно купить.',
    kind: 'videos' as const,
  },
  {
    grad: ['Один тап —', 'и в корзине'],
    accent: 1,
    sub: 'Понравилось в ролике? Добавляй и оформляй сразу, без переписок с продавцом.',
    kind: 'cart' as const,
  },
  {
    grad: ['Локальные', 'магазины рядом'],
    accent: 0,
    sub: 'Оставляйте заявки продавцам и уточняйте наличие напрямую.',
    kind: 'stores' as const,
  },
]

const GRADS = [
  'linear-gradient(95deg,#FF2D7A 0%,#FF5C8A 45%,#FFA24B 100%)',
  'linear-gradient(95deg,#4AA8FF 0%,#7C5CFF 55%,#FF2D7A 100%)',
]

function Welcome({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) {
  const [i, setI] = useState(0)
  const last = STORY.length - 1

  // авто-перелистывание
  useEffect(() => {
    const t = setTimeout(() => setI((p) => (p + 1) % STORY.length), 4200)
    return () => clearTimeout(t)
  }, [i])

  const s = STORY[i]

  return (
    <motion.div {...slide} className="flex flex-1 flex-col px-5">
      {/* бренд */}
      <div className="flex items-center justify-between pt-4">
        <div className="inline-flex items-center gap-1.5 rounded-full glass-dark px-3 py-1.5 text-xs font-bold">
          <Icon name="sparkles" size={14} /> Swipd
        </div>
        <button onClick={onSkip} className="text-xs font-semibold text-muted">Пропустить</button>
      </div>

      {/* сцена-история (свайп + авто) */}
      <motion.div
        className="relative mt-4 flex-1 overflow-hidden rounded-[34px]"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.18}
        onDragEnd={(_, info) => {
          if (info.offset.x < -60 && i < last) setI(i + 1)
          else if (info.offset.x > 60 && i > 0) setI(i - 1)
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {s.kind === 'videos' && <VideoStage />}
            {s.kind === 'cart' && <CartStage />}
            {s.kind === 'stores' && <StoresStage />}
          </motion.div>
        </AnimatePresence>

        {/* затемнение снизу + заголовок */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6">
          <AnimatePresence mode="wait">
            <motion.div key={i} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }}>
              <h1 className="font-display text-[34px] font-black leading-[1.04] tracking-tight text-white">
                {s.grad[0]}<br />
                <span style={{ background: GRADS[s.accent], WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {s.grad[1]}
                </span>
              </h1>
              <p className="mt-3 max-w-[320px] text-[15px] leading-snug text-white/80">{s.sub}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* точки */}
      <div className="flex justify-center gap-1.5 py-4">
        {STORY.map((_, k) => (
          <button key={k} onClick={() => setI(k)} className={`h-1.5 rounded-full transition-all ${k === i ? 'w-6 bg-magenta' : 'w-1.5 bg-white/20'}`} />
        ))}
      </div>

      {/* CTA */}
      <div className="pb-5">
        <button
          onClick={onStart}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-grad-accent font-bold text-white shadow-glow active:scale-[0.98]"
        >
          Начать <Icon name="chevronRight" size={20} />
        </button>
      </div>
    </motion.div>
  )
}

// «живая» вертикальная лента видео (две колонки в противоход)
function VideoStage() {
  const colA = INTRO_VIDEOS.slice(0, 3)
  const colB = INTRO_VIDEOS.slice(3, 6)
  return (
    <div className="absolute inset-0 grid grid-cols-2 gap-2 bg-[#0a0a0a] p-2">
      <Marquee items={[...colA, ...colA]} dir="up" />
      <Marquee items={[...colB, ...colB]} dir="down" className="-mt-10" />
    </div>
  )
}

function Marquee({ items, dir, className = '' }: { items: string[]; dir: 'up' | 'down'; className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <motion.div
        className="flex flex-col gap-2"
        animate={{ y: dir === 'up' ? ['0%', '-50%'] : ['-50%', '0%'] }}
        transition={{ duration: 22, ease: 'linear', repeat: Infinity }}
      >
        {items.map((src, k) => (
          <video key={k} src={src} className="h-44 w-full shrink-0 rounded-2xl object-cover" muted loop autoPlay playsInline preload="metadata" />
        ))}
      </motion.div>
    </div>
  )
}

// демонстрация «добавить в корзину → оформить»
function CartStage() {
  return (
    <div className="absolute inset-0 bg-[#0a0a0a]">
      <video src="/content/shoqan/v3.mp4" className="h-full w-full object-cover opacity-95" muted loop autoPlay playsInline preload="metadata" />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.25 }}
        className="absolute right-4 top-1/3 flex items-center gap-2 rounded-2xl bg-grad-accent px-4 py-2.5 text-sm font-bold text-white shadow-glow"
      >
        <Icon name="bag" size={16} /> +В выбранное
      </motion.div>
      <motion.div
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
        className="absolute left-4 top-[58%] flex items-center gap-2 rounded-2xl glass-dark px-4 py-2.5 text-sm font-semibold text-white"
      >
        <Icon name="check" size={16} /> Оформить за 30 секунд
      </motion.div>
    </div>
  )
}

// кластер локальных магазинов (как на референсе)
function StoresStage() {
  const avatars = ['1556905055-8f358a7a47b2', '1496747611176-843222e1e57c', '1591047139829-d91aecb6caea', '1620799140408-edc6dcb6d633', '1485462537746-965f33f7f6a7']
  const pos = [
    { top: '12%', left: '12%' }, { top: '20%', right: '14%' }, { top: '46%', left: '20%' },
    { top: '40%', right: '12%' }, { top: '62%', left: '46%' },
  ]
  return (
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,#221018,#0a0a0a)]">
      <div className="absolute left-1/2 top-[38%] h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-grad-accent shadow-glow" />
      {avatars.map((id, k) => (
        <motion.div
          key={id}
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.15 * k, type: 'spring', stiffness: 220, damping: 16 }}
          className="absolute h-14 w-14 overflow-hidden rounded-2xl border-2 border-white/15"
          style={pos[k] as any}
        >
          <Img src={`https://images.unsplash.com/photo-${id}?w=160&q=70&auto=format&fit=crop`} alt="" fallbackLabel="" className="h-full w-full object-cover" />
        </motion.div>
      ))}
    </div>
  )
}

function Styles({
  selected,
  toggle,
  onNext,
}: {
  selected: StyleTag[]
  toggle: (t: StyleTag) => void
  onNext: () => void
}) {
  return (
    <motion.div {...slide} className="flex flex-1 flex-col overflow-hidden px-6">
      <div className="pt-6">
        <h2 className="font-display text-2xl font-extrabold">Что тебе по вкусу?</h2>
        <p className="mt-1 text-sm text-muted">Выбери стили — можно несколько. Так лента станет твоей.</p>
      </div>
      <div className="no-scrollbar mt-4 grid flex-1 grid-cols-2 gap-3 overflow-y-auto pb-4">
        {STYLE_TAGS.map((t) => {
          const active = selected.includes(t)
          return (
            <button
              key={t}
              onClick={() => toggle(t)}
              className="relative h-36 overflow-hidden rounded-3xl text-left"
            >
              <Img
                src={styleImg(t)}
                alt={STYLE_LABELS[t]}
                fallbackLabel={STYLE_LABELS[t]}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
              {active && (
                <div className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-magenta text-white shadow-glow">
                  <Icon name="check" size={16} />
                </div>
              )}
              <span className="absolute bottom-2.5 left-3 font-bold text-white">
                {STYLE_LABELS[t]}
              </span>
              {active && <div className="absolute inset-0 rounded-3xl ring-[3px] ring-magenta" />}
            </button>
          )
        })}
      </div>
      <div className="py-4">
        <button
          onClick={onNext}
          disabled={selected.length === 0}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-magenta font-bold text-white shadow-glow disabled:opacity-40 disabled:shadow-none"
        >
          Далее {selected.length > 0 && `· ${selected.length}`} <Icon name="chevronRight" size={20} />
        </button>
      </div>
    </motion.div>
  )
}

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => String(a + i))
const SIZE_OPTS = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const FIT_OPTS: { key: Fit; label: string }[] = [
  { key: 'slim', label: 'Облегающая' },
  { key: 'regular', label: 'Стандартная' },
  { key: 'oversize', label: 'Свободная' },
]

function SizesStep({ onNext }: { onNext: () => void }) {
  const updateSizes = useStore((s) => s.updateSizes)
  const existing = useStore((s) => s.user.sizes)
  const [height, setHeight] = useState(existing.height ?? '170')
  const [weight, setWeight] = useState(existing.weight ?? '60')
  const [top, setTop] = useState(existing.top ?? 'M')
  const [bottom, setBottom] = useState(existing.bottom ?? 'M')
  const [shoe, setShoe] = useState(existing.shoe ?? '40')
  const [fit, setFit] = useState<Fit>(existing.fit ?? 'regular')

  const save = () => {
    updateSizes({ height, weight, top, bottom, shoe, fit })
    onNext()
  }

  return (
    <motion.div {...slide} className="flex flex-1 flex-col overflow-hidden">
      <div className="px-6 pt-6">
        <h2 className="font-display text-[26px] font-black leading-tight text-balance">Подбери свой размер</h2>
        <p className="mt-1 text-sm text-white/55">Крути колёсики до нужного значения. Можно пропустить.</p>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-4 pt-3">
        {/* рост / вес */}
        <div className="grid grid-cols-2 gap-3">
          <Wheel label="Рост" unit="см" values={range(150, 200)} value={height} onChange={setHeight} />
          <Wheel label="Вес" unit="кг" values={range(40, 120)} value={weight} onChange={setWeight} />
        </div>
        {/* верх / низ / обувь */}
        <div className="mt-3 grid grid-cols-3 gap-3">
          <Wheel label="Верх" values={SIZE_OPTS} value={top} onChange={setTop} />
          <Wheel label="Низ" values={SIZE_OPTS} value={bottom} onChange={setBottom} />
          <Wheel label="Обувь" values={range(35, 46)} value={shoe} onChange={setShoe} />
        </div>
        {/* посадка */}
        <div className="mt-4">
          <div className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-white/45">Посадка</div>
          <div className="grid grid-cols-3 gap-2">
            {FIT_OPTS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFit(f.key)}
                className={`h-12 rounded-2xl border text-sm font-bold transition active:scale-[0.97] ${
                  fit === f.key ? 'border-magenta bg-magenta/15 text-white' : 'border-white/10 bg-white/[0.04] text-white/70'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2 px-5 pb-6">
        <button
          onClick={save}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-grad-accent font-bold text-white shadow-glow active:scale-[0.98]"
        >
          <Icon name="check" size={20} /> Сохранить размеры
        </button>
        <button onClick={onNext} className="h-10 w-full text-sm font-semibold text-white/45">Пропустить</button>
      </div>
    </motion.div>
  )
}

const WHEEL_ITEM = 40 // высота строки, px

function Wheel({ label, unit, values, value, onChange }: { label: string; unit?: string; values: string[]; value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const lockRef = useRef(false)

  // выставить начальную прокрутку на выбранное значение
  useEffect(() => {
    const idx = values.indexOf(value)
    if (ref.current && idx >= 0) ref.current.scrollTop = idx * WHEEL_ITEM
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onScroll = () => {
    if (!ref.current || lockRef.current) return
    const idx = Math.round(ref.current.scrollTop / WHEEL_ITEM)
    const v = values[Math.max(0, Math.min(values.length - 1, idx))]
    if (v && v !== value) onChange(v)
  }

  return (
    <div>
      <div className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-white/45">{label}</div>
      <div className="relative h-[160px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
        {/* центральная подсветка */}
        <div className="pointer-events-none absolute inset-x-2 top-1/2 h-10 -translate-y-1/2 rounded-xl bg-white/[0.08] ring-1 ring-white/10" />
        <div
          ref={ref}
          onScroll={onScroll}
          className="no-scrollbar h-full snap-y snap-mandatory overflow-y-auto"
        >
          <div style={{ height: WHEEL_ITEM * 1.5 }} />
          {values.map((v) => (
            <div
              key={v}
              className={`flex snap-center items-center justify-center text-lg font-bold transition ${
                v === value ? 'text-white' : 'text-white/35'
              }`}
              style={{ height: WHEEL_ITEM }}
            >
              {v}
              {unit && <span className="ml-1 text-xs font-semibold text-white/40">{unit}</span>}
            </div>
          ))}
          <div style={{ height: WHEEL_ITEM * 1.5 }} />
        </div>
      </div>
    </div>
  )
}

function Ready({ onGo }: { onGo: () => void }) {
  return (
    <motion.div {...slide} className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        className="flex h-24 w-24 items-center justify-center rounded-full bg-magenta text-white shadow-glow"
      >
        <Icon name="check" size={48} />
      </motion.div>
      <h2 className="mt-6 font-display text-3xl font-extrabold">Лента готова</h2>
      <p className="mt-2 max-w-[300px] text-sm text-muted">
        Мы будем подбирать товары по твоим свайпам, лайкам и сохранениям.
      </p>
      <button
        onClick={onGo}
        className="mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-magenta font-bold text-white shadow-glow"
      >
        <Icon name="spark" size={20} /> Перейти в Discovery
      </button>
    </motion.div>
  )
}

