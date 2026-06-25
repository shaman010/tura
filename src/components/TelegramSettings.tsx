import { useState } from 'react'
import { BottomSheet } from './BottomSheet'
import { Icon } from './Icon'
import { loadTg, saveTg, tgGetChatId, tgSendRaw, type TgConfig } from '../lib/telegram'

interface Props {
  open: boolean
  onClose: () => void
  onChange?: (cfg: TgConfig) => void
}

type Status = { kind: 'idle' | 'ok' | 'err' | 'loading'; msg?: string }

export function TelegramSettings({ open, onClose, onChange }: Props) {
  const [cfg, setCfg] = useState<TgConfig>(() => loadTg())
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  const set = (patch: Partial<TgConfig>) => setCfg((c) => ({ ...c, ...patch }))

  const persist = (next: TgConfig) => {
    saveTg(next)
    setCfg(next)
    onChange?.(next)
  }

  const detectChatId = async () => {
    if (!cfg.token) return setStatus({ kind: 'err', msg: 'Сначала вставьте токен бота' })
    setStatus({ kind: 'loading', msg: 'Ищу chat_id…' })
    const r = await tgGetChatId(cfg.token.trim())
    if (r.ok && r.chatId) {
      const next = { ...cfg, chatId: r.chatId }
      persist(next)
      setStatus({ kind: 'ok', msg: `chat_id найден: ${r.chatId}` })
    } else {
      setStatus({ kind: 'err', msg: r.error })
    }
  }

  const saveAndTest = async () => {
    const next: TgConfig = {
      token: cfg.token.trim(),
      chatId: cfg.chatId.trim(),
      enabled: true,
    }
    if (!next.token || !next.chatId) {
      return setStatus({ kind: 'err', msg: 'Нужны токен и chat_id' })
    }
    setStatus({ kind: 'loading', msg: 'Отправляю тест…' })
    const r = await tgSendRaw(next.token, next.chatId, '✅ <b>Swipd</b> подключён. Сюда будут приходить новые заказы.')
    if (r.ok) {
      persist(next)
      setStatus({ kind: 'ok', msg: 'Подключено! Проверьте Telegram.' })
    } else {
      setStatus({ kind: 'err', msg: r.error })
    }
  }

  const disable = () => {
    persist({ ...cfg, enabled: false })
    setStatus({ kind: 'idle' })
  }

  return (
    <BottomSheet open={open} onClose={onClose} full label="Telegram-уведомления">
      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-10 pt-2">
        <div className="mb-1 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#229ED9] text-ink">
            <Icon name="share" size={18} />
          </span>
          <h3 className="text-lg font-bold">Заявки в Telegram</h3>
          {cfg.enabled && (
            <span className="ml-auto flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Вкл
            </span>
          )}
        </div>
        <p className="mb-4 text-sm text-muted">
          Каждый новый заказ автоматически прилетит в чат с ботом.
        </p>

        {/* steps */}
        <ol className="mb-5 space-y-2 rounded-3xl bg-surface p-4 text-sm">
          <Step n={1}>
            Откройте <b>@BotFather</b> в Telegram → <code className="rounded bg-ink/5 px-1">/newbot</code> → скопируйте <b>токен</b>.
          </Step>
          <Step n={2}>Напишите своему боту <code className="rounded bg-ink/5 px-1">/start</code>.</Step>
          <Step n={3}>Вставьте токен ниже и нажмите «Определить chat_id».</Step>
        </ol>

        <label className="mb-3 flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">Bot token</span>
          <input
            value={cfg.token}
            onChange={(e) => set({ token: e.target.value })}
            placeholder="123456789:AA…"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="h-12 rounded-2xl bg-surface px-4 font-mono text-[13px] outline-none focus:ring-2 focus:ring-magenta/40"
          />
        </label>

        <label className="mb-2 flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">Chat ID</span>
          <div className="flex gap-2">
            <input
              value={cfg.chatId}
              onChange={(e) => set({ chatId: e.target.value })}
              placeholder="напр. 123456789"
              inputMode="numeric"
              className="h-12 flex-1 rounded-2xl bg-surface px-4 font-mono text-[13px] outline-none focus:ring-2 focus:ring-magenta/40"
            />
            <button
              onClick={detectChatId}
              className="flex h-12 flex-shrink-0 items-center gap-1.5 rounded-2xl bg-ink/10 px-4 text-sm font-bold text-ink"
            >
              <Icon name="sparkles" size={16} /> Определить
            </button>
          </div>
        </label>

        {status.kind !== 'idle' && (
          <div
            className={`mt-3 flex items-start gap-2 rounded-2xl p-3 text-sm ${
              status.kind === 'ok'
                ? 'bg-emerald-500/10 text-emerald-700'
                : status.kind === 'err'
                  ? 'bg-magenta/10 text-magenta'
                  : 'bg-surface text-muted'
            }`}
          >
            <Icon
              name={status.kind === 'ok' ? 'check' : status.kind === 'err' ? 'close' : 'sparkles'}
              size={16}
              className="mt-0.5 flex-shrink-0"
            />
            <span>{status.msg}</span>
          </div>
        )}

        <button
          onClick={saveAndTest}
          disabled={status.kind === 'loading'}
          className="mt-5 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-magenta font-bold text-ink shadow-glow disabled:opacity-50"
        >
          <Icon name="bolt" size={20} /> Сохранить и отправить тест
        </button>

        {cfg.enabled && (
          <button onClick={disable} className="mt-2 h-11 w-full text-sm font-semibold text-muted">
            Отключить уведомления
          </button>
        )}

        <p className="mt-5 text-center text-xs leading-relaxed text-muted">
          ⚠️ Токен хранится в браузере (localStorage). Это нормально для демо и одного продавца, но
          для публичного прода уведомления лучше отправлять через бэкенд, чтобы не раскрывать токен.
        </p>
      </div>
    </BottomSheet>
  )
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-magenta text-[11px] font-bold text-ink">
        {n}
      </span>
      <span className="leading-snug">{children}</span>
    </li>
  )
}

