import { AnimatePresence, motion } from 'framer-motion'
import { Img } from './Img'
import { useStore } from '../store/useStore'

/** Toast — самозакрывающийся, aria-live для скринридеров. */
export function Toast() {
  const toast = useStore((s) => s.toast)
  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-[120] flex justify-center"
      style={{ bottom: 'calc(env(safe-area-inset-bottom,0px) + 96px)' }}
      aria-live="polite"
    >
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            className="rounded-full bg-white px-5 py-3 text-sm font-bold text-black shadow-soft"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Микроанимация «товар улетает в корзину». */
export function FlyToCart() {
  const fly = useStore((s) => s.fly)
  if (!fly) return null
  const target = document.getElementById('nav-cart')?.getBoundingClientRect()
  const tx = target ? target.left + target.width / 2 : window.innerWidth / 2
  const ty = target ? target.top + target.height / 2 : window.innerHeight - 60

  return (
    <AnimatePresence>
      <motion.div
        key={fly.key}
        initial={{ x: fly.x - 28, y: fly.y - 28, scale: 1, opacity: 1 }}
        animate={{ x: tx - 18, y: ty - 18, scale: 0.3, opacity: 0.4 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="pointer-events-none fixed left-0 top-0 z-[130]"
        style={{ width: 56, height: 56 }}
      >
        <Img src={fly.url} alt="" fallbackLabel="" className="h-full w-full rounded-2xl object-cover shadow-glow" />
      </motion.div>
    </AnimatePresence>
  )
}
