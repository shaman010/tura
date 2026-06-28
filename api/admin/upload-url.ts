import crypto from 'crypto'
import { isAdminRequest } from '../_lib/cloudflare'

const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'])
const maxBytes = 100 * 1024 * 1024

function hmac(key: Buffer | string, value: string) {
  return crypto.createHmac('sha256', key).update(value).digest()
}

function sha256(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

function amzDates(date = new Date()) {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, '')
  return { amzDate: iso, shortDate: iso.slice(0, 8) }
}

function cleanName(name: string) {
  const safe = name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '')
  return safe || `upload-${Date.now()}`
}

function encodePath(key: string) {
  return key.split('/').map(encodeURIComponent).join('/')
}

function presignPutUrl(key: string) {
  const accountId = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const bucket = process.env.R2_BUCKET_NAME
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) throw new Error('R2 env is not configured')

  const host = `${accountId}.r2.cloudflarestorage.com`
  const canonicalUri = `/${bucket}/${encodePath(key)}`
  const { amzDate, shortDate } = amzDates()
  const region = 'auto'
  const service = 's3'
  const credentialScope = `${shortDate}/${region}/${service}/aws4_request`
  const signedHeaders = 'host'
  const params = new URLSearchParams({
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${accessKeyId}/${credentialScope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': '900',
    'X-Amz-SignedHeaders': signedHeaders,
  })
  params.sort()

  const canonicalHeaders = `host:${host}\n`
  const canonicalRequest = ['PUT', canonicalUri, params.toString(), canonicalHeaders, signedHeaders, 'UNSIGNED-PAYLOAD'].join('\n')
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, sha256(canonicalRequest)].join('\n')
  const dateKey = hmac(`AWS4${secretAccessKey}`, shortDate)
  const regionKey = hmac(dateKey, region)
  const serviceKey = hmac(regionKey, service)
  const signingKey = hmac(serviceKey, 'aws4_request')
  const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex')
  params.set('X-Amz-Signature', signature)

  return `https://${host}${canonicalUri}?${params.toString()}`
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ ok: false })
    if (!isAdminRequest(req)) return res.status(401).json({ ok: false, error: 'Unauthorized' })

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
    const fileName = cleanName(String(body.fileName || 'upload'))
    const contentType = String(body.contentType || '')
    const size = Number(body.size || 0)
    if (!allowed.has(contentType)) return res.status(400).json({ ok: false, error: 'Unsupported file type' })
    if (!size || size > maxBytes) return res.status(400).json({ ok: false, error: 'File is too large. Max 100MB.' })

    const folder = contentType.startsWith('video/') ? 'videos' : 'images'
    const key = `${folder}/${Date.now()}-${fileName}`
    const publicBase = (process.env.R2_PUBLIC_BASE_URL || '').replace(/\/+$/, '')
    return res.status(200).json({
      ok: true,
      method: 'PUT',
      uploadUrl: presignPutUrl(key),
      publicUrl: publicBase ? `${publicBase}/${key}` : key,
    })
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error?.message || 'Could not create upload URL' })
  }
}
