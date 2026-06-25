// Безопасная работа с localStorage: битый JSON или недоступное хранилище
// не должны ронять приложение.

export function safeGetFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function safeSetToStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* приватный режим / переполнение — не критично */
  }
}

export function safeRemoveFromStorage(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}
