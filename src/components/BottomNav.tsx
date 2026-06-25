import { Icon, type IconName } from './Icon'
import { cartCount, useStore, type Tab } from '../store/useStore'

const ITEMS: { tab: Tab; icon: IconName; label: string }[] = [
  { tab: 'discovery', icon: 'home', label: 'Главное' },
  { tab: 'search', icon: 'search', label: 'Поиск' },
  { tab: 'cart', icon: 'bag', label: 'Выбранное' },
  { tab: 'account', icon: 'user', label: 'Профиль' },
]

export function BottomNav() {
  const tab = useStore((s) => s.tab)
  const setTab = useStore((s) => s.setTab)
  const count = useStore((s) => cartCount(s.user.cart))

  return (
    <nav
      className="pointer-events-none fixed bottom-0 left-0 right-0 z-40 flex justify-center"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 10px)' }}
      aria-label="Главная навигация"
    >
      <div className="pointer-events-auto mx-3 flex w-full max-w-[440px] items-center justify-around rounded-[28px] border border-ink/10 glass-dark px-2 py-2">
        {ITEMS.map((item) => {
          const active = tab === item.tab
          const tone = active ? 'text-magenta' : 'text-ink/45'
          return (
            <button
              key={item.tab}
              id={item.tab === 'cart' ? 'nav-cart' : undefined}
              onClick={() => setTab(item.tab)}
              aria-current={active ? 'page' : undefined}
              aria-label={item.label}
              className="relative flex min-h-[48px] min-w-[58px] flex-col items-center justify-center gap-1 rounded-full px-3 py-1 transition active:scale-90"
            >
              <span className={`relative ${tone}`}>
                <Icon name={item.icon} size={23} />
                {item.tab === 'cart' && count > 0 && (
                  <span className="absolute -right-1.5 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border border-black/40 bg-magenta px-1 text-[11px] font-bold leading-none text-ink">
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </span>
              <span className={`text-[10px] font-semibold ${tone}`}>{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
