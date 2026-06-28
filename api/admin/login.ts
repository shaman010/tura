import { adminToken } from '../_lib/cloudflare'

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false })
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return res.status(500).json({ ok: false, error: 'ADMIN_PASSWORD is not configured' })
  if (body.password !== expected) return res.status(401).json({ ok: false, error: 'Wrong password' })
  return res.status(200).json({ ok: true, token: adminToken() })
}
