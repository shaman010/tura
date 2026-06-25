import type { Order } from '../types'
import { productById } from '../data/products'
import { tenge } from './format'

const KEY = 'swipd-telegram'

export interface TgConfig {
  token: string
  chatId: string
  enabled: boolean
}

const DEFAULT: TgConfig = { token: '', chatId: '', enabled: false }

export function loadTg(): TgConfig {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT
  } catch {
    return DEFAULT
  }
}

export function saveTg(cfg: TgConfig) {
  localStorage.setItem(KEY, JSON.stringify(cfg))
}

export function tgConfigured(cfg = loadTg()) {
  return cfg.enabled && !!cfg.token && !!cfg.chatId
}

type Result = { ok: boolean; error?: string }

export async function tgSendRaw(_token: string, _chatId: string, _text: string): Promise<Result> {
  return {
    ok: false,
    error: 'Telegram MVP notification must go through /api/send-lead or another serverless function.',
  }
}

export async function tgSend(text: string): Promise<Result> {
  try {
    const res = await fetch('/api/send-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (res.ok) return { ok: true }
    return { ok: false, error: 'send-lead endpoint is not configured' }
  } catch {
    return { ok: false, error: 'send-lead endpoint is not available' }
  }
}

export async function tgGetChatId(_token: string): Promise<{ ok: boolean; chatId?: string; error?: string }> {
  return {
    ok: false,
    error: 'Chat id lookup is disabled in frontend. Configure Telegram in serverless environment variables.',
  }
}

export function formatOrderMessage(order: Order): string {
  const lines = order.items
    .map((it) => {
      const p = productById(it.productId)
      const name = p?.title ?? it.productTitle ?? it.productId
      const price = tenge((p?.price ?? it.price) * it.qty)
      return `- ${esc(name)} (${esc(it.size)}/${esc(it.color)}) x${it.qty} - ${price}`
    })
    .join('\n')

  const c = order.customer
  return [
    `<b>Новая заявка ${esc(order.id.slice(0, 8))}</b>`,
    `Продавец: ${esc(order.sellerName)}`,
    `Дата: ${esc(order.date)}`,
    `Источник: ${esc(order.source)}`,
    '',
    `Покупатель: ${esc(c.name)} · ${esc(c.phone)}`,
    `Город: ${esc(c.city)}`,
    `Комментарий: ${esc(c.comment || 'Без комментария')}`,
    '',
    lines,
    '',
    `Сумма витрины: <b>${tenge(order.total)}</b>`,
  ].join('\n')
}

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
