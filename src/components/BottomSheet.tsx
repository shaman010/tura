import { AnimatePresence, motion, useDragControls } from 'framer-motion'
import type { ReactNode } from 'react'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  /** full = почти на весь экран, иначе авто по контенту */
  full?: boolean
  /** явная высота (Tailwind-класс), напр. 'h-[78%]' — приоритетнее full */
  heightClass?: string
  label?: string
}

export function BottomSheet({ open, onClose, children, full, heightClass, label }: BottomSheetProps) {
  const controls = useDragControls()
  const height = heightClass ?? (full ? 'h-[88%]' : 'max-h-[88%]')
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* scrim — тап закрывает */}
          <button aria-label="Закрыть" className="absolute inset-0 bg-black/65" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-label={label}
            className={`relative z-10 flex w-full max-w-[480px] flex-col rounded-t-4xl border-t border-ink/10 bg-night text-ink shadow-soft ${height}`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            drag="y"
            dragListener={false}
            dragControls={controls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 500) onClose()
            }}
          >
            {/* зона-ручка: тянем её вниз, чтобы закрыть. Контент при этом скроллится */}
            <div
              onPointerDown={(e) => controls.start(e)}
              className="flex flex-shrink-0 cursor-grab touch-none justify-center pb-1 pt-3 active:cursor-grabbing"
            >
              <div className="h-1.5 w-12 rounded-full bg-ink/25" />
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
