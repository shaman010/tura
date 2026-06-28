import crypto from 'crypto'
import { isAdminRequest } from '../_lib/cloudflare'

const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'])
const maxBytes = 4 * 1024 * 1024

function hmac(key: Buffer | string, value: string) {
  return crypto.createHmac('sha256', key).update(value).digest()
}

function sha256(value: Buffer | string) {
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

async function putR2(key: string, contentType: string, body: Buffer) {
  const accountId = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const bucket = process.env.R2_BUCKET_NAME
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error('R2 env is not configured')
  }

  const host = `${accountId}.r2.cloudflarestorage.com`
  const path = `/${bucket}/${key.split('/').map(encodeURIComponent).join('/')}`
  const url = `https://${host}${path}`
  const { amzDate, shortDate } = amzDates()
  const payloadHash = sha256(body)
  const region = 'auto'
  const service = 's3'
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date'
  const canonicalHeaders = `content-type:${contentType}\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`
  const canonicalRequest = ['PUT', path, '', canonicalHeaders, signedHeaders, payloadHash].join('\n')
  const credentialScope = `${shortDate}/${region}/${service}/aws4_request`
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, sha256(canonicalRequest)].join('\n')
  const dateKey = hmac(`AWS4${secretAccessKey}`, shortDate)
  const regionKey = hmac(dateKey, region)
  const serviceKey = hmac(regionKey, service)
  const signingKey = hmac(serviceKey, 'aws4_request')
  const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex')
  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: authorization,
      'Content-Type': contentType,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
    },
    body,
  })
  if (!response.ok) throw new Error(await response.text())
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ ok: false })
    if (!isAdminRequest(req)) return res.status(401).json({ ok: false, error: 'Unauthorized' })

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
    const fileName = cleanName(String(body.fileName || 'upload'))
    const contentType = String(body.contentType || '')
    const base64 = String(body.base64 || '')
    if (!allowed.has(contentType)) return res.status(400).json({ ok: false, error: 'Unsupported file type' })

    const buffer = Buffer.from(base64, 'base64')
    if (!buffer.length || buffer.length > maxBytes) {
      return res.status(400).json({ ok: false, error: 'File is too large for Vercel upload. Use URL for videos.' })
    }

    const folder = contentType.startsWith('video/') ? 'videos' : 'images'
    const key = `${folder}/${Date.now()}-${fileName}`
    await putR2(key, contentType, buffer)

    const publicBase = (process.env.R2_PUBLIC_BASE_URL || '').replace(/\/+$/, '')
    return res.status(200).json({ ok: true, url: publicBase ? `${publicBase}/${key}` : key })
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error?.message || 'Upload failed' })
  }
}
