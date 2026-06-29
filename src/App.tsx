import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from './store/useStore'
import { Onboarding } from './screens/Onboarding'
import { Discovery } from './screens/Discovery'
import { Search } from './screens/Search'
import { Cart } from './screens/Cart'
import { Account } from './screens/Account'
import { Checkout } from './screens/Checkout'
import { Seller } from './screens/Seller'
import { PublicSellerPage } from './screens/PublicSellerPage'
import { PublicProductPage } from './screens/PublicProductPage'
import { PublicPostPage } from './screens/PublicPostPage'
import { Admin } from './screens/Admin'
import { Studio } from './screens/Studio'
import { BottomNav } from './components/BottomNav'
import { ProductDetail } from './components/ProductDetail'
import { BrandStore } from './components/BrandStore'
import { SettingsScreen } from './components/SettingsScreen'
import { AuthScreen } from './components/AuthScreen'
import { Toast } from './components/Overlays'
import { track } from './lib/analytics'

const SCREENS = {
  discovery: Discovery,
  search: Search,
  cart: Cart,
  account: Account,
}

/** есть ли открытый оверлей (любой) */
function anyOverlayOpen() {
  const s = useStore.getState()
  return !!(s.authOpen || s.checkoutOpen || s.openProductId || s.settingsOpen || s.sellerOpen || s.storeBrand)
}

/** закрыть самый верхний оверлей; вернуть true если что-то закрыли */
function closeTopOverlay() {
  const s = useStore.getState()
  if (s.authOpen) return s.closeAuth(), true
  if (s.checkoutOpen) return s.closeCheckout(), true
  if (s.openProductId) return s.closeProduct(), true
  if (s.settingsOpen) return s.closeSettings(), true
  if (s.sellerOpen) return s.closeSeller(), true
  if (s.storeBrand) return s.closeStore(), true
  return false
}

export default function App() {
  const onboarded = useStore((s) => s.onboarded)
  const tab = useStore((s) => s.tab)
  // ключ, меняющийся при любом изменении набора оверлеев
  const overlayKey = useStore(
    (s) => `${s.authOpen}|${s.checkoutOpen}|${s.openProductId}|${s.settingsOpen}|${s.sellerOpen}|${s.storeBrand}`,
  )
  const prevAny = useRef(false)

  const theme = useStore((s) => s.theme)
  const path = window.location.pathname
  const sellerMatch = path.match(/^\/seller\/([^/]+)/)
  const productMatch = path.match(/^\/product\/([^/]+)/)
  const postMatch = path.match(/^\/post\/([^/]+)/)
  const adminMatch = path.match(/^\/admin/)
  const studioMatch = path.match(/^\/studio/)

  // Восстановить сессию Supabase при загрузке (если бэкенд подключён).
  useEffect(() => {
    useStore.getState().hydrateSession()
    track('page_view', { path: window.location.pathname })
  }, [])

  // Применить тему к документу.
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  // Аппаратная/браузерная кнопка «назад» закрывает оверлеи — нельзя застрять.
  useEffect(() => {
    const onPop = () => {
      if (closeTopOverlay() && anyOverlayOpen()) {
        window.history.pushState({ overlay: true }, '')
      }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // при появлении первого оверлея добавляем запись в историю (чтобы «назад» её снял)
  useEffect(() => {
    const any = anyOverlayOpen()
    if (any && !prevAny.current) window.history.pushState({ overlay: true }, '')
    prevAny.current = any
  }, [overlayKey])

  if (adminMatch) return <Admin />
  if (studioMatch) return <Studio />

  if (sellerMatch || productMatch || postMatch) {
    return (
      <div className="relative h-[100dvh] w-full max-w-[480px] overflow-hidden bg-base text-ink shadow-2xl">
        {sellerMatch ? (
          <PublicSellerPage slug={decodeURIComponent(sellerMatch[1])} />
        ) : postMatch ? (
          <PublicPostPage id={decodeURIComponent(postMatch[1])} />
        ) : (
          <PublicProductPage id={decodeURIComponent(productMatch![1])} />
        )}
        <ProductDetail />
        <Checkout />
        <Toast />
      </div>
    )
  }

  return (
    <div className="relative h-[100dvh] w-full max-w-[480px] overflow-hidden bg-base text-ink shadow-2xl">
      {!onboarded ? (
        <Onboarding />
      ) : (
        <>
          <AnimatePresence initial={false}>
            <motion.div
              key={tab}
              className="absolute inset-0 h-full w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {(() => {
                const Screen = SCREENS[tab] ?? Discovery
                return <Screen />
              })()}
            </motion.div>
          </AnimatePresence>

          <BottomNav />
          <BrandStore />
          <ProductDetail />
          <Checkout />
          <Seller />
          <SettingsScreen />
          <AuthScreen />
          <Toast />
        </>
      )}
    </div>
  )
}
