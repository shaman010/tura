import type { CSSProperties } from 'react'
import { Icon, type IconName } from './Icon'

/**
 * Единая кнопка «назад» — гласс-эффект как у нижнего меню (glass-dark + blur).
 */
export function BackButton({
  onClick,
  icon = 'chevronLeft',
  className = '',
  style,
  label = 'Назад',
}: {
  onClick: () => void
  icon?: IconName
  className?: string
  style?: CSSProperties
  label?: string
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={style}
      className={`flex h-11 w-11 items-center justify-center rounded-2xl border border-ink/10 glass-dark text-ink transition active:scale-90 ${className}`}
    >
      <Icon name={icon} size={22} />
    </button>
  )
}
