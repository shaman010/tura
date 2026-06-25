import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Icon } from '../components/Icon'
import { Img } from '../components/Img'
import { BackButton } from '../components/BackButton'
import { useStore } from '../store/useStore'
import { tenge } from '../lib/format'
import type { Lead, LeadStatus } from '../types'

const FLOW: LeadStatus[] = ['Отправлена', 'Продавец получил', 'В обработке', 'Закрыта']
const STATUS_COLOR: Record<LeadStatus, string> = {
  Отправлена: 'bg-electric/10 text-electric',
  'Продавец получил': 'bg-violet/10 text-violet',
  'В обработке': 'bg-magenta/10 text-magenta',
  Закрыта: 'bg-emerald-500/10 text-emerald-600',
}

type Filter = 'Все' | LeadStatus

export function Seller() {
  const open = useStore((s) => s.sellerOpen)
  const close = useStore((s) => s.closeSeller)
  const leads = useStore((s) => s.user.leads ?? s.user.orders)
  const seed = useStore((s) => s.seedDemoOrder)
  const [filter, setFilter] = useState<Filter>('Все')

  const stats = useMemo(() => {
    const by = (st: LeadStatus) => leads.filter((o) => o.status === st).length
    return { new: by('Отправлена'), active: by('В обработке'), done: by('Закрыта'), total: leads.length }
  }, [leads])

  const filtered = useMemo(() => {
    const list = filter === 'Все' ? leads : leads.filter((o) => o.status === filter)
    return [...list].sort((a, b) => b.createdAt - a.createdAt)
  }, [leads, filter])

  const filters: Filter[] = ['Все', ...FLOW]

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[96] flex justify-center bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative flex h-full w-full max-w-[480px] flex-col bg-[#101014] text-ink"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 36 }}
          >
            <div className="px-5 pb-4" style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 16px)' }}>
              <div className="flex items-center justify-between">
                <BackButton onClick={close} icon="chevronDown" label="Закрыть" />
                <div className="flex items-center gap-2 font-display text-lg font-extrabold">
                  <Icon name="box" size={20} /> Заявки продавца
                </div>
                <button onClick={seed} aria-label="Тестовая заявка" className="flex h-10 w-10 items-center justify-center rounded-full bg-ink/10">
                  <Icon name="plus" size={20} />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-2">
                <Stat label="новые" value={stats.new} accent="text-electric" />
                <Stat label="в работе" value={stats.active} accent="text-magenta" />
                <Stat label="закрыто" value={stats.done} accent="text-emerald-400" />
                <Stat label="всего" value={stats.total} accent="text-violet" />
              </div>
            </div>

            <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-3">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-shrink-0 rounded-full px-3.5 py-2 text-sm font-bold transition ${
                    filter === f ? 'bg-magenta text-ink' : 'bg-ink/10 text-ink/70'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto px-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 24px)' }}>
              {filtered.length === 0 ? (
                <div className="mt-16 flex flex-col items-center gap-3 px-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ink/10">
                    <Icon name="box" size={30} />
                  </div>
                  <h3 className="font-bold">Заявок нет</h3>
                  <p className="text-sm text-ink/60">
                    Новые заявки от покупателей появятся здесь. Можно создать тестовую, чтобы посмотреть работу панели.
                  </p>
                  <button onClick={seed} className="mt-1 flex items-center gap-2 rounded-full bg-magenta px-5 py-2.5 text-sm font-bold shadow-glow">
                    <Icon name="plus" size={16} /> Тестовая заявка
                  </button>
                </div>
              ) : (
                filtered.map((lead) => <LeadCard key={lead.id} lead={lead} />)
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div className="rounded-2xl bg-ink/5 p-2.5 text-center">
      <div className={`text-xl font-extrabold tabular ${accent}`}>{value}</div>
      <div className="text-[10px] font-semibold text-ink/50">{label}</div>
    </div>
  )
}

function LeadCard({ lead }: { lead: Lead }) {
  const update = useStore((s) => s.updateOrderStatus)
  return (
    <div className="rounded-3xl bg-ink/5 p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-bold">Заявка {lead.id.slice(0, 8)}</div>
          <div className="text-xs text-ink/50">{lead.date} · {lead.sellerName}</div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_COLOR[lead.status]}`}>{lead.status}</span>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-2xl bg-ink/5 p-2.5 text-xs">
        <Icon name="user" size={15} className="mt-0.5 text-ink/60" />
        <div className="leading-snug">
          <div className="font-semibold">
            {lead.customer.name} · <span className="text-ink/60">{lead.customer.phone}</span>
          </div>
          <div className="text-ink/50">{lead.customer.city}</div>
          {lead.customer.comment && <div className="mt-0.5 text-ink/50">{lead.customer.comment}</div>}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {lead.items.map((it) => (
          <div key={it.productId + it.size + it.color} className="flex items-center gap-2.5">
            <Img src={it.productImage} alt={it.productTitle} fallbackLabel="" className="h-10 w-9 rounded-xl object-cover" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{it.productTitle}</div>
              <div className="text-xs text-ink/50">
                {it.size} · {it.color} · {it.qty} шт
              </div>
            </div>
            <span className="text-sm font-bold tabular">{tenge(it.price * it.qty)}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-ink/10 pt-3">
        <span className="text-xs text-ink/50">Сумма витрины</span>
        <span className="font-extrabold tabular">{tenge(lead.total)}</span>
      </div>

      <div className="mt-3 flex gap-1 rounded-2xl bg-ink/5 p-1">
        {FLOW.map((st) => {
          const active = lead.status === st
          return (
            <button
              key={st}
              onClick={() => update(lead.id, st)}
              className={`flex-1 rounded-xl px-2 py-2 text-[11px] font-bold transition ${
                active ? 'bg-magenta text-ink shadow-glow' : 'text-ink/60'
              }`}
            >
              {st}
            </button>
          )
        })}
      </div>
    </div>
  )
}
