import { Component, type ReactNode } from 'react'
import { safeRemoveFromStorage } from '../lib/storage'

interface Props {
  children: ReactNode
}
interface State {
  hasError: boolean
}

/**
 * Ловит ошибки рендера, чтобы приложение не превращалось в белый/чёрный экран.
 * Показывает тёмный recovery-экран. Сброс чистит ТОЛЬКО временные данные
 * (cart/checkout/order draft), не трогая products/feed (они в коде, не в storage).
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error)
  }

  private resetTemp = () => {
    // Чистим только пользовательские временные данные внутри persisted store.
    try {
      const raw = localStorage.getItem('swipd-store')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.state?.user) {
          parsed.state.user.cart = []
          parsed.state.checkoutItemIds = []
          parsed.state.checkoutOpen = false
          localStorage.setItem('swipd-store', JSON.stringify(parsed))
        }
      }
    } catch {
      safeRemoveFromStorage('swipd-store')
    }
    window.location.reload()
  }

  private backToDiscovery = () => {
    this.setState({ hasError: false })
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="flex h-[100dvh] w-full max-w-[480px] flex-col items-center justify-center gap-3 bg-base px-8 text-center text-ink">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-ink/10 bg-ink/[0.04] text-2xl">
          ⚠️
        </div>
        <h1 className="text-xl font-extrabold">Что-то пошло не так</h1>
        <p className="max-w-[280px] text-sm text-ink/60">
          Произошла ошибка интерфейса. Можно вернуться в ленту или сбросить временные данные.
        </p>
        <div className="mt-2 flex w-full max-w-[280px] flex-col gap-2">
          <button
            onClick={this.backToDiscovery}
            className="h-12 rounded-2xl bg-grad-accent font-bold text-ink shadow-glow active:scale-[0.98]"
          >
            Вернуться в Дискавери
          </button>
          <button
            onClick={this.resetTemp}
            className="h-12 rounded-2xl border border-ink/15 text-sm font-bold text-ink/80 active:scale-[0.98]"
          >
            Сбросить временные данные
          </button>
        </div>
      </div>
    )
  }
}
