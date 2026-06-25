import { useState } from 'react'
import { Icon } from './Icon'
import { useStore } from '../store/useStore'
import type { Fit, Sizes } from '../types'

const FITS: { key: Fit; label: string }[] = [
  { key: 'slim', label: 'Облегающая' },
  { key: 'regular', label: 'Стандартная' },
  { key: 'oversize', label: 'Свободная' },
]

interface Props {
  onDone?: () => void
  compact?: boolean
}

/** Mini-форма подбора размера — переиспользуется в Product Detail и Onboarding. */
export function SizeFinder({ onDone, compact }: Props) {
  const saved = useStore((s) => s.user.sizes)
  const updateSizes = useStore((s) => s.updateSizes)
  const [form, setForm] = useState<Sizes>(saved)

  const set = (k: keyof Sizes, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const field = (k: keyof Sizes, label: string, ph: string, type = 'number') => (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-muted">{label}</span>
      <input
        inputMode={type === 'number' ? 'numeric' : 'text'}
        value={(form[k] as string) ?? ''}
        onChange={(e) => set(k, e.target.value)}
        placeholder={ph}
        className="h-12 rounded-2xl bg-surface px-4 text-[15px] outline-none focus:ring-2 focus:ring-magenta/40"
      />
    </label>
  )

  return (
    <div className="space-y-4">
      <div className={`grid gap-3 ${compact ? 'grid-cols-2' : 'grid-cols-2'}`}>
        {field('height', 'Рост, см', '170')}
        {field('weight', 'Вес, кг', '60')}
        {field('top', 'Размер верха', 'M', 'text')}
        {field('bottom', 'Размер низа', 'M', 'text')}
        {field('shoe', 'Размер обуви', '40')}
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">Посадка</span>
          <div className="flex h-12 items-center gap-1 rounded-2xl bg-surface p-1">
            {FITS.map((f) => (
              <button
                key={f.key}
                onClick={() => set('fit', f.key)}
                className={`flex-1 rounded-xl px-1 py-2 text-[11px] font-semibold transition ${
                  form.fit === f.key ? 'bg-ink text-card shadow-soft' : 'text-muted'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </label>
      </div>
      <button
        onClick={() => {
          updateSizes(form)
          onDone?.()
        }}
        className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-magenta py-3.5 font-bold text-ink shadow-glow"
      >
        <Icon name="check" size={20} /> Сохранить размеры
      </button>
    </div>
  )
}
