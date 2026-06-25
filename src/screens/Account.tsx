import { useEffect, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Icon, type IconName } from '../components/Icon'
import { Img } from '../components/Img'
import { BottomSheet } from '../components/BottomSheet'
import { SizeFinder } from '../components/SizeFinder'
import { useStore } from '../store/useStore'
import { productById } from '../data/products'
import { preferencePercents } from '../lib/recommendations'
import { tenge, compact } from '../lib/format'
import type { Address } from '../types'

const AVATARS = [
  '1494790108377-be9c29b29330',
  '1534528741775-53994a69daeb',
  '1517841905240-472988babdf9',
  '1531123897727-8f129e1688ce',
  '1438761681033-6461ffad8d80',
  '1544005313-94ddf0286df2',
].map((id) => `https://images.unsplash.com/photo-${id}?w=160&q=80&auto=format&fit=crop`)

export function Account() {
  const user = useStore((s) => s.user)
  const requestedSection = useStore((s) => s.accountSection)
  const clearAccountSection = useStore((s) => s.clearAccountSection)
  const openSettings = useStore((s) => s.openSettings)
  const openAuth = useStore((s) => s.openAuth)
  const openSeller = useStore((s) => s.openSeller)
  const [editOpen, setEditOpen] = useState(false)

  // приход из success «Мои заказы» → плавно проскроллить к острову заказов
  useEffect(() => {
    if (!requestedSection) return
    const id = requestedSection === 'orders' ? 'acct-orders' : `acct-${requestedSection}`
    const t = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      clearAccountSection()
    }, 120)
    return () => window.clearTimeout(t)
  }, [requestedSection, clearAccountSection])

  const stats = [
    { label: 'Сохранено', value: compact(user.savedProducts.length), accent: false },
    { label: 'Заявки', value: String((user.leads ?? user.orders).length), accent: false },
    { label: 'Свайпы', value: compact(user.swipes), accent: false },
    { label: 'Style match', value: styleMatch(user.stylePreferences) + '%', accent: true },
  ]

  return (
    <div className="relative flex h-full w-full max-w-[480px] flex-col bg-base text-ink">
      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-28">
        {/* top bar */}
        <div
          className="flex items-center justify-between pb-1"
          style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 16px)' }}
        >
          <h1 className="px-1 text-2xl font-extrabold">Профиль</h1>
          <IconBtn icon="settings" onClick={openSettings} />
        </div>

        <div className="space-y-3 pt-2">
          {/* profile island */}
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-[28px] border border-ink/10 bg-ink/[0.04] p-5"
          >
            <div className="flex items-center gap-4">
              <Img
                src={user.avatar}
                alt={user.name}
                fallbackLabel={user.name[0]}
                className="h-[68px] w-[68px] rounded-full border border-ink/10 object-cover"
              />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-xl font-extrabold leading-tight">{user.name}</h2>
                <p className="truncate text-sm text-muted">{user.username}</p>
              </div>
              <button
                onClick={() => setEditOpen(true)}
                className="flex-shrink-0 rounded-full border border-ink/15 px-4 py-2 text-xs font-bold active:scale-95"
              >
                Редактировать
              </button>
            </div>
            <div className="mt-5 grid grid-cols-4 gap-1 border-t border-ink/10 pt-4">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <div className={`text-lg font-extrabold tabular ${s.accent ? 'text-magenta' : 'text-ink'}`}>
                    {s.value}
                  </div>
                  <div className="mt-0.5 text-[10px] font-semibold text-muted">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* account type / registration */}
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: 0.02 }}
            className="rounded-[28px] border border-ink/10 bg-ink/[0.04] p-4"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-grad-accent text-ink">
                <Icon name={user.role === 'seller' ? 'store' : 'user'} size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold">
                  {user.role === 'seller' ? user.storeName || 'Аккаунт продавца' : 'Аккаунт покупателя'}
                </div>
                <div className="text-xs text-muted">
                  {user.role === 'seller' ? 'Вы продавец' : 'Покупайте и сохраняйте образы'}
                </div>
              </div>
              <span className="flex-shrink-0 rounded-full bg-ink/[0.06] px-2.5 py-1 text-[11px] font-bold text-muted">
                {user.role === 'seller' ? 'Продавец' : 'Покупатель'}
              </span>
            </div>
            <div className="mt-3 flex gap-2">
              {user.role === 'seller' && (
                <button
                  onClick={openSeller}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-grad-accent text-sm font-bold text-ink shadow-glow active:scale-[0.98]"
                >
                  <Icon name="box" size={18} /> Кабинет продавца
                </button>
              )}
              <button
                onClick={openAuth}
                className={`flex h-11 items-center justify-center gap-2 rounded-2xl border border-ink/15 text-sm font-bold active:scale-[0.98] ${
                  user.role === 'seller' ? 'flex-shrink-0 px-4' : 'flex-1 bg-grad-accent shadow-glow'
                }`}
              >
                {user.role === 'seller' ? 'Сменить роль' : <><Icon name="store" size={18} /> Стать продавцом</>}
              </button>
            </div>
          </motion.section>

          <Saved delay={0.04} />
          <Prefs delay={0.08} />
          <SizesSection delay={0.12} />
          <Addresses delay={0.16} />
          <Orders delay={0.2} />
        </div>
      </div>

      <EditProfile open={editOpen} onClose={() => setEditOpen(false)} />
    </div>
  )
}

function styleMatch(prefs: ReturnType<typeof useStore.getState>['user']['stylePreferences']) {
  const vals = Object.values(prefs)
  const positive = vals.filter((v) => v > 0).reduce((a, b) => a + b, 0)
  const total = vals.reduce((a, b) => a + Math.abs(b), 0) || 1
  return Math.min(99, Math.round((positive / total) * 100))
}

/* ---------- island primitive ---------- */

function Island({
  id,
  icon,
  title,
  action,
  children,
  delay = 0,
}: {
  id?: string
  icon: IconName
  title: string
  action?: ReactNode
  children: ReactNode
  delay?: number
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay }}
      className="scroll-mt-4 rounded-[28px] border border-ink/10 bg-ink/[0.04] p-5"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-ink/[0.06] text-ink">
            <Icon name={icon} size={18} />
          </span>
          <h3 className="truncate text-[15px] font-bold">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </motion.section>
  )
}

function IconBtn({ icon, onClick }: { icon: IconName; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={icon}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 bg-ink/[0.05] text-ink/80 active:scale-90"
    >
      <Icon name={icon} size={19} />
    </button>
  )
}

function PillBtn({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-ink/[0.06] px-3.5 py-2 text-xs font-bold active:scale-95"
    >
      {children}
    </button>
  )
}

/* ---------- sections ---------- */

function Saved({ delay }: { delay: number }) {
  const saved = useStore((s) => s.user.savedProducts)
  const openProduct = useStore((s) => s.openProduct)
  const setTab = useStore((s) => s.setTab)
  const items = saved.slice(0, 6)
  return (
    <Island
      id="acct-saved"
      icon="heart"
      title="Избранное"
      delay={delay}
      action={
        saved.length > 0 ? (
          <span className="rounded-full bg-magenta/15 px-2.5 py-1 text-xs font-bold text-magenta">{saved.length}</span>
        ) : undefined
      }
    >
      {saved.length === 0 ? (
        <EmptyInline
          sub="Свайпай вправо или жми сердечко в ленте — образы появятся здесь."
          cta="В Дискавери"
          onCta={() => setTab('discovery')}
        />
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {items.map((id) => {
            const p = productById(id)
            if (!p) return null
            return (
              <button key={id} onClick={() => openProduct(id)} className="relative aspect-[3/4] overflow-hidden rounded-2xl active:scale-[0.98]">
                <Img src={p.images[0]} alt={p.title} fallbackLabel={p.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                <span className="absolute bottom-1.5 left-2 right-2 truncate text-[11px] font-bold text-ink">{p.title}</span>
              </button>
            )
          })}
        </div>
      )}
    </Island>
  )
}

function Prefs({ delay }: { delay: number }) {
  const prefs = useStore((s) => s.user.stylePreferences)
  const data = preferencePercents(prefs).slice(0, 5)
  return (
    <Island id="acct-prefs" icon="sparkles" title="ДНК стиля" delay={delay}>
      <div className="space-y-3">
        {data.map((d, i) => (
          <div key={d.tag}>
            <div className="mb-1 flex justify-between text-sm font-semibold">
              <span>{d.label}</span>
              <span className="tabular text-muted">{d.percent}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-ink/[0.06]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${d.percent}%` }}
                transition={{ delay: delay + i * 0.05, type: 'spring', stiffness: 120, damping: 20 }}
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg,#FF2D7A,#D91D62)' }}
              />
            </div>
          </div>
        ))}
      </div>
    </Island>
  )
}

function SizesSection({ delay }: { delay: number }) {
  const sizes = useStore((s) => s.user.sizes)
  const [open, setOpen] = useState(false)
  const has = Object.values(sizes).some(Boolean)
  const rows: [string, string | undefined][] = [
    ['Рост', sizes.height && `${sizes.height} см`],
    ['Вес', sizes.weight && `${sizes.weight} кг`],
    ['Верх', sizes.top],
    ['Низ', sizes.bottom],
    ['Обувь', sizes.shoe],
    ['Посадка', sizes.fit && { slim: 'Облегающая', regular: 'Стандартная', oversize: 'Свободная' }[sizes.fit]],
  ]
  return (
    <Island
      id="acct-sizes"
      icon="ruler"
      title="Мои размеры"
      delay={delay}
      action={<PillBtn onClick={() => setOpen(true)}>{has ? 'Изменить' : 'Заполнить'}</PillBtn>}
    >
      {has ? (
        <div className="grid grid-cols-2 gap-x-4">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between border-b border-ink/[0.06] py-2.5 text-sm last:border-0">
              <span className="text-muted">{k}</span>
              <span className="font-bold">{v ?? '—'}</span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyInline sub="Добавь параметры — будем рекомендовать размер автоматически." />
      )}
      <BottomSheet open={open} onClose={() => setOpen(false)} label="Мои размеры">
        <div className="px-5 pb-8 pt-2">
          <h3 className="mb-4 text-lg font-bold">Мои размеры</h3>
          <SizeFinder onDone={() => setOpen(false)} />
        </div>
      </BottomSheet>
    </Island>
  )
}

function Addresses({ delay }: { delay: number }) {
  const addresses = useStore((s) => s.user.addresses)
  const add = useStore((s) => s.addAddress)
  const update = useStore((s) => s.updateAddress)
  const remove = useStore((s) => s.removeAddress)
  const [editing, setEditing] = useState<Address | null>(null)
  const [open, setOpen] = useState(false)

  const startNew = () => {
    setEditing({ id: '', label: 'Дом', city: '', street: '', recipient: '', phone: '' })
    setOpen(true)
  }

  return (
    <Island
      id="acct-addresses"
      icon="pin"
      title="Адреса"
      delay={delay}
      action={
        <PillBtn onClick={startNew}>
          <Icon name="plus" size={14} /> Добавить
        </PillBtn>
      }
    >
      {addresses.length === 0 ? (
        <EmptyInline sub="Добавь адрес доставки, чтобы оформлять заказы в один тап." />
      ) : (
        <div className="space-y-2">
          {addresses.map((a) => (
            <div key={a.id} className="flex items-start gap-3 rounded-2xl bg-ink/[0.04] p-3.5">
              <Icon name="pin" size={18} className="mt-0.5 flex-shrink-0 text-magenta" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold">{a.label}</div>
                <div className="truncate text-sm text-ink/80">{a.city}, {a.street}</div>
                <div className="truncate text-xs text-muted">{a.recipient} · {a.phone}</div>
              </div>
              <button
                onClick={() => {
                  setEditing(a)
                  setOpen(true)
                }}
                aria-label="Изменить"
                className="text-muted active:text-electric"
              >
                <Icon name="settings" size={18} />
              </button>
              <button onClick={() => remove(a.id)} aria-label="Удалить" className="text-muted active:text-magenta">
                <Icon name="trash" size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
      <BottomSheet open={open} onClose={() => setOpen(false)} label="Адрес">
        {editing && (
          <AddressForm
            initial={editing}
            onSave={(a) => {
              if (a.id) update(a)
              else add(a)
              setOpen(false)
            }}
          />
        )}
      </BottomSheet>
    </Island>
  )
}

function AddressForm({ initial, onSave }: { initial: Address; onSave: (a: Address) => void }) {
  const [a, setA] = useState(initial)
  const set = (k: keyof Address, v: string) => setA((x) => ({ ...x, [k]: v }))
  const f = (k: keyof Address, label: string, ph: string, ac?: string) => (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-muted">{label}</span>
      <input
        value={a[k]}
        autoComplete={ac}
        onChange={(e) => set(k, e.target.value)}
        placeholder={ph}
        className="h-12 rounded-2xl bg-ink/[0.06] px-4 text-[15px] text-ink outline-none focus:ring-2 focus:ring-magenta/40"
      />
    </label>
  )
  const valid = a.city && a.street && a.recipient
  return (
    <div className="space-y-3 px-5 pb-8 pt-2">
      <h3 className="text-lg font-bold">{initial.id ? 'Изменить адрес' : 'Новый адрес'}</h3>
      {f('label', 'Название', 'Дом / Работа')}
      <div className="grid grid-cols-2 gap-3">
        {f('city', 'Город', 'Алматы', 'address-level2')}
        {f('street', 'Улица, дом', 'Абая 10, кв 5', 'street-address')}
      </div>
      {f('recipient', 'Получатель', 'Имя Фамилия', 'name')}
      {f('phone', 'Телефон', '+7 ___ ___', 'tel')}
      <button
        onClick={() => valid && onSave(a)}
        disabled={!valid}
        className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-grad-accent font-bold text-ink shadow-glow disabled:opacity-40"
      >
        <Icon name="check" size={20} /> Сохранить
      </button>
    </div>
  )
}

function Orders({ delay }: { delay: number }) {
  const orders = useStore((s) => s.user.leads ?? s.user.orders)
  return (
    <Island
      id="acct-orders"
      icon="box"
      title="Мои заявки"
      delay={delay}
      action={
        orders.length > 0 ? (
          <span className="rounded-full bg-ink/[0.06] px-2.5 py-1 text-xs font-bold text-muted">{orders.length}</span>
        ) : undefined
      }
    >
      {orders.length === 0 ? (
        <EmptyInline sub="Оставьте первую заявку — она появится здесь со статусом продавца." />
      ) : (
        <div className="space-y-2">
          {orders.map((o) => (
            <div key={o.id} className="rounded-2xl bg-ink/[0.04] p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">Заявка {o.id.slice(0, 8)}</span>
                <span className="rounded-full bg-electric/15 px-2.5 py-1 text-xs font-bold text-electric">{o.status}</span>
              </div>
              <div className="mt-1 text-xs text-muted">{o.date} · {o.items.length} товара</div>
              <div className="mt-2 flex items-center -space-x-2">
                {o.items.map((it) => {
                  const p = productById(it.productId)
                  return p ? (
                    <Img
                      key={it.productId}
                      src={p.images[0]}
                      alt={p.title}
                      fallbackLabel=""
                      className="h-10 w-10 rounded-xl border-2 border-[#0c0c0e] object-cover"
                    />
                  ) : null
                })}
                <span className="ml-auto self-center pl-2 text-sm font-extrabold tabular">{tenge(o.total)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Island>
  )
}

function EmptyInline({ sub, cta, onCta }: { sub: string; cta?: string; onCta?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 py-4 text-center">
      <p className="max-w-[260px] text-sm text-muted">{sub}</p>
      {cta && (
        <button onClick={onCta} className="mt-1 rounded-full border border-magenta/40 px-5 py-2 text-sm font-bold text-magenta active:scale-95">
          {cta}
        </button>
      )}
    </div>
  )
}

/* ---------- edit profile ---------- */

function EditProfile({ open, onClose }: { open: boolean; onClose: () => void }) {
  const user = useStore((s) => s.user)
  const updateProfile = useStore((s) => s.updateProfile)
  const [name, setName] = useState(user.name)
  const [username, setUsername] = useState(user.username)
  const [avatar, setAvatar] = useState(user.avatar)

  // синхронизируем при открытии
  useEffect(() => {
    if (open) {
      setName(user.name)
      setUsername(user.username)
      setAvatar(user.avatar)
    }
  }, [open, user.name, user.username, user.avatar])

  const save = () => {
    const uname = username.trim().startsWith('@') ? username.trim() : '@' + username.trim().replace(/^@+/, '')
    updateProfile({ name: name.trim() || user.name, username: uname, avatar })
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} label="Редактировать профиль">
      <div className="space-y-4 px-5 pb-8 pt-2">
        <h3 className="text-lg font-bold">Редактировать профиль</h3>

        <div className="flex justify-center">
          <Img src={avatar} alt="" fallbackLabel="" className="h-20 w-20 rounded-full border border-ink/10 object-cover" />
        </div>
        <div>
          <div className="mb-2 text-xs font-semibold text-muted">Аватар</div>
          <div className="flex flex-wrap justify-center gap-2.5">
            {AVATARS.map((url) => (
              <button
                key={url}
                onClick={() => setAvatar(url)}
                className={`h-12 w-12 overflow-hidden rounded-full border-2 transition ${
                  avatar === url ? 'border-magenta' : 'border-ink/10'
                }`}
              >
                <Img src={url} alt="" fallbackLabel="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">Имя</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Имя"
            className="h-12 rounded-2xl bg-ink/[0.06] px-4 text-[15px] text-ink outline-none focus:ring-2 focus:ring-magenta/40"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">Username</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="@username"
            autoCapitalize="none"
            className="h-12 rounded-2xl bg-ink/[0.06] px-4 text-[15px] text-ink outline-none focus:ring-2 focus:ring-magenta/40"
          />
        </label>

        <button
          onClick={save}
          className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-grad-accent font-bold text-ink shadow-glow active:scale-[0.98]"
        >
          <Icon name="check" size={20} /> Сохранить
        </button>
      </div>
    </BottomSheet>
  )
}

