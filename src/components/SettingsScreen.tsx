import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Icon, type IconName } from './Icon'
import { AnalyticsSheet } from './AnalyticsSheet'
import { BackButton } from './BackButton'
import { useStore } from '../store/useStore'

export function SettingsScreen() {
  const open = useStore((s) => s.settingsOpen)
  return <AnimatePresence>{open && <Panel />}</AnimatePresence>
}

function Panel() {
  const close = useStore((s) => s.closeSettings)
  const openSeller = useStore((s) => s.openSeller)
  const openAuth = useStore((s) => s.openAuth)
  const reset = useStore((s) => s.resetAll)
  const showToast = useStore((s) => s.showToast)
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  const [analyticsOpen, setAnalyticsOpen] = useState(false)

  return (
    <motion.div
      className="fixed inset-0 z-[85] flex justify-center bg-base text-ink"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="no-scrollbar relative h-full w-full max-w-[480px] overflow-y-auto px-4 pb-24">
        {/* header */}
        <div
          className="flex items-center gap-3 pb-2"
          style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 16px)' }}
        >
          <BackButton onClick={close} />
          <h1 className="text-2xl font-extrabold">Настройки</h1>
        </div>

        <div className="space-y-3 pt-2">
          {/* управление магазином */}
          <Island title="Магазин">
            <Row icon="box" tone="bg-magenta" title="Кабинет продавца" sub="Заявки и статусы" onClick={openSeller} />
            <Row icon="sparkles" tone="bg-electric" title="Аналитика" sub="Просмотры, лайки, заказы" onClick={() => setAnalyticsOpen(true)} />
          </Island>

          {/* тема оформления */}
          <Island title="Оформление">
            <div className="grid grid-cols-2 gap-2">
              <ThemeCard active={theme === 'dark'} onClick={() => setTheme('dark')} icon="eye" label="Тёмная" />
              <ThemeCard active={theme === 'light'} onClick={() => setTheme('light')} icon="spark" label="Светлая" />
            </div>
          </Island>

          {/* аккаунт */}
          <Island title="Аккаунт и приложение">
            <Row icon="store" tone="bg-magenta" title="Регистрация / роль" sub="Покупатель или продавец" onClick={openAuth} />
            <Row icon="user" tone="bg-ink/10" title="Уведомления" sub="Push и email" onClick={() => showToast('Раздел в разработке')} />
            <Row icon="eye" tone="bg-ink/10" title="Приватность" sub="Данные и видимость" onClick={() => showToast('Раздел в разработке')} />
            <Row icon="comment" tone="bg-ink/10" title="Помощь и поддержка" sub="Частые вопросы" onClick={() => showToast('Раздел в разработке')} />
          </Island>

          <button
            onClick={() => {
              if (confirm('Сбросить онбординг, ленту и все данные?')) {
                reset()
                close()
              }
            }}
            className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl border border-magenta/30 text-sm font-bold text-magenta active:scale-[0.99]"
          >
            <Icon name="trash" size={17} /> Сбросить демо-данные
          </button>
          <p className="pb-4 text-center text-xs text-ink/30">Swipd · версия 0.1 (demo)</p>
        </div>
      </div>

      <AnalyticsSheet open={analyticsOpen} onClose={() => setAnalyticsOpen(false)} />
    </motion.div>
  )
}

function Island({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[28px] border border-ink/10 bg-ink/[0.04] p-4">
      <h3 className="mb-3 px-1 text-[13px] font-bold uppercase tracking-wide text-muted">{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  )
}

function ThemeCard({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: IconName; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-2xl border p-3 text-left transition active:scale-[0.98] ${
        active ? 'border-magenta bg-magenta/10' : 'border-ink/10 bg-ink/[0.04]'
      }`}
    >
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${active ? 'bg-grad-accent text-white' : 'bg-ink/10'}`}>
        <Icon name={icon} size={18} />
      </span>
      <span className="text-sm font-bold">{label}</span>
      {active && <Icon name="check" size={16} className="ml-auto text-magenta" />}
    </button>
  )
}

function Row({ icon, tone, title, sub, onClick }: { icon: IconName; tone: string; title: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-2xl bg-ink/[0.04] p-3 text-left active:scale-[0.99]">
      <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl ${tone} text-ink`}>
        <Icon name={icon} size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">{title}</span>
        <span className="block truncate text-xs text-muted">{sub}</span>
      </span>
      <Icon name="chevronRight" size={18} className="text-ink/40" />
    </button>
  )
}

