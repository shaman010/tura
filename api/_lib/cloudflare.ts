type D1Result<T = Record<string, unknown>> = {
  success: boolean
  result?: Array<{ success: boolean; results?: T[]; error?: string }>
  errors?: Array<{ message: string }>
}

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CF_ACCOUNT_ID
const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID || process.env.D1_DATABASE_ID
const token = process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN

export function cloudflareReady() {
  return Boolean(accountId && databaseId && token)
}

export function requireCloudflare() {
  if (!cloudflareReady()) {
    throw new Error('Cloudflare D1 env is not configured')
  }
}

export async function d1Query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  requireCloudflare()
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  })
  const data = (await response.json()) as D1Result<T>
  if (!response.ok || !data.success || data.result?.some((item) => !item.success)) {
    const message = data.errors?.map((error) => error.message).join('; ') || data.result?.find((item) => item.error)?.error || 'D1 request failed'
    throw new Error(message)
  }
  return data.result?.flatMap((item) => item.results ?? []) ?? []
}

export function isAdminRequest(req: any) {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return false
  const token = String(req.headers.authorization || req.headers.Authorization || '').replace(/^Bearer\s+/i, '')
  const expectedToken = Buffer.from(`swipd-admin:${expected}`).toString('base64')
  return token === expectedToken
}

export function adminToken() {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) throw new Error('ADMIN_PASSWORD is not configured')
  return Buffer.from(`swipd-admin:${expected}`).toString('base64')
}

export function parseJson(value: unknown, fallback: any) {
  if (value == null || value === '') return fallback
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

export function json(value: unknown) {
  return JSON.stringify(value ?? [])
}

export const id = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
