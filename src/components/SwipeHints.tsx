import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Icon } from './Icon'
import { safeGetFromStorage, safeSetToStorage } from '../lib/storage'

const KEY = 'swipd-hints-seen'

/**
 * Демонстративные подсказки управления лентой. Показываются один раз
 * (первый заход), затем флаг хранится в localStorage.
 */
export function SwipeHints() {
  const [show, setShow] = useState(() => !safeGetFromStorage<boolean>(KEY, false))

  const dismiss = () => {
    safeSetToStorage(KEY, true)
    setShow(false)
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="absolute inset-0 z-[70] flex flex-col items-center justify-center px-8 text-center text-ink"
          style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={dismiss}
        >
          <div className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">
            Как смотреть ленту
          </div>
          <h2 className="mb-8 text-2xl font-extrabold">Свайпай образы</h2>

          {/* свайпы влево/вправо */}
          <div className="relative mb-10 flex w-full max-w-[320px] items-center justify-between">
            {/* НЕ интересно */}
            <motion.div
              className="flex flex-col items-center gap-2"
              animate={{ opacity: [0.45, 1, 0.45] }}
              transition={{ duration: 3, repeat: Infinity, times: [0.5, 0.62, 0.75] }}
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-ink/15 bg-ink/[0.06]">
                <Icon name="close" size={26} />
              </span>
              <span className="flex items-center gap-1 text-sm font-bold text-ink/80">
                <Icon name="chevronLeft" size={14} /> Не интересно
              </span>
            </motion.div>

            {/* палец, который свайпает */}
            <motion.div
              className="pointer-events-none absolute left-1/2 top-1/2 z-10 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-black shadow-glow"
              animate={{ x: [0, 88, 0, -88, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Icon name="heart" size={22} />
            </motion.div>

            {/* Нравится */}
            <motion.div
              className="flex flex-col items-center gap-2 text-magenta"
              animate={{ opacity: [0.45, 1, 0.45] }}
              transition={{ duration: 3, repeat: Infinity, times: [0, 0.12, 0.25] }}
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-magenta text-ink shadow-glow">
                <Icon name="heartFill" size={26} />
              </span>
              <span className="flex items-center gap-1 text-sm font-bold">
                Нравится <Icon name="chevronRight" size={14} />
              </span>
            </motion.div>
          </div>

          {/* вверх/вниз и тап */}
          <div className="flex flex-col items-center gap-3">
            <motion.div
              className="flex items-center gap-2 rounded-full bg-ink/[0.06] px-4 py-2 text-sm font-semibold"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Icon name="arrowUp" size={16} className="text-electric" /> Листай вверх — следующий образ
            </motion.div>
            <div className="flex items-center gap-2 rounded-full bg-ink/[0.06] px-4 py-2 text-sm font-semibold">
              <Icon name="eye" size={16} className="text-ink/70" /> Тап по карточке — показать цену
            </div>
          </div>

          <button
            onClick={dismiss}
            className="mt-9 flex h-13 w-full max-w-[280px] items-center justify-center gap-2 rounded-2xl bg-grad-accent px-6 font-bold text-ink shadow-glow active:scale-[0.98]"
          >
            Понятно, начать <Icon name="spark" size={18} />
          </button>
          <span className="mt-3 text-xs text-ink/40">Нажми в любом месте, чтобы закрыть</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
