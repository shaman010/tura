export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (!token || !chatId) {
    return res.status(200).json({ ok: false, error: 'Telegram is not configured' })
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
  const text = typeof body.text === 'string' ? body.text : ''
  if (!text.trim()) {
    return res.status(400).json({ ok: false, error: 'Empty lead payload' })
  }

  const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  })
  const data = await tgRes.json().catch(() => ({}))
  return res.status(200).json({ ok: tgRes.ok && data.ok, telegram: data })
}
