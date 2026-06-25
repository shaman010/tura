import { supabase } from './supabase'
import type { UserRole } from '../types'

// Патч, который мы вливаем в store.user после входа/регистрации.
export interface ProfilePatch {
  id: string
  email?: string
  name: string
  username: string
  avatar: string
  role: UserRole
  storeName?: string
  storeTagline?: string
}

export interface SignUpInput {
  email: string
  password: string
  name: string
  username: string
  avatar: string
  role: UserRole
  storeName?: string
  storeTagline?: string
}

function slugify(s: string): string {
  const base = s.toLowerCase().replace(/[^a-z0-9а-я]+/gi, '-').replace(/^-+|-+$/g, '')
  return (base || 'store') + '-' + Math.random().toString(36).slice(2, 6)
}

function normUsername(u: string): string {
  return u.startsWith('@') ? u : '@' + u.replace(/^@+/, '')
}

/** Регистрация: создаём auth-пользователя, профиль и (для продавца) магазин. */
export async function signUp(
  input: SignUpInput,
): Promise<{ ok: boolean; error?: string; needsConfirm?: boolean; profile?: ProfilePatch }> {
  if (!supabase) return { ok: false, error: 'Бэкенд не подключён' }

  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: { name: input.name } },
  })
  if (error) return { ok: false, error: error.message }
  const uid = data.user?.id
  if (!uid) return { ok: false, error: 'Не удалось создать пользователя' }

  // Нет сессии → включено подтверждение по email.
  if (!data.session) return { ok: true, needsConfirm: true }

  return finalizeProfile(uid, input)
}

/** Дозаполняем профиль и создаём магазин (после того как есть сессия). */
async function finalizeProfile(
  uid: string,
  input: SignUpInput,
): Promise<{ ok: boolean; error?: string; profile?: ProfilePatch }> {
  if (!supabase) return { ok: false, error: 'Бэкенд не подключён' }
  const username = normUsername(input.username)

  // upsert на случай гонки с триггером handle_new_user
  const { error: pErr } = await supabase.from('profiles').upsert(
    { id: uid, name: input.name, username, avatar_url: input.avatar, role: input.role },
    { onConflict: 'id' },
  )
  if (pErr) return { ok: false, error: pErr.message }

  if (input.role === 'seller' && input.storeName) {
    const { error: sErr } = await supabase
      .from('stores')
      .insert({ owner_id: uid, name: input.storeName, slug: slugify(input.storeName), tagline: input.storeTagline || null })
    if (sErr && !/duplicate|unique/i.test(sErr.message)) return { ok: false, error: sErr.message }
  }

  return {
    ok: true,
    profile: {
      id: uid,
      email: input.email,
      name: input.name,
      username,
      avatar: input.avatar,
      role: input.role,
      storeName: input.role === 'seller' ? input.storeName : undefined,
      storeTagline: input.role === 'seller' ? input.storeTagline : undefined,
    },
  }
}

/** Вход по email + паролю. */
export async function signIn(
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string; profile?: ProfilePatch }> {
  if (!supabase) return { ok: false, error: 'Бэкенд не подключён' }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { ok: false, error: error.message }
  const uid = data.user?.id
  if (!uid) return { ok: false, error: 'Сессия не создана' }
  const profile = await loadProfile(uid, email)
  return { ok: true, profile }
}

/** Подтянуть профиль (+ магазин) текущего пользователя. */
export async function loadProfile(uid: string, email?: string): Promise<ProfilePatch | undefined> {
  if (!supabase) return undefined
  const { data: p } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle()
  if (!p) return undefined
  const { data: store } = await supabase
    .from('stores')
    .select('name,tagline')
    .eq('owner_id', uid)
    .limit(1)
    .maybeSingle()
  return {
    id: uid,
    email,
    name: p.name,
    username: p.username ?? '@user',
    avatar: p.avatar_url ?? '',
    role: p.role,
    storeName: store?.name,
    storeTagline: store?.tagline ?? undefined,
  }
}

/** Текущая сессия при загрузке приложения. */
export async function currentProfile(): Promise<ProfilePatch | undefined> {
  if (!supabase) return undefined
  const { data } = await supabase.auth.getSession()
  const u = data.session?.user
  if (!u) return undefined
  return loadProfile(u.id, u.email ?? undefined)
}

export async function signOut(): Promise<void> {
  if (!supabase) return
  await supabase.auth.signOut()
}

/** Вход через Google / Apple (OAuth-редирект). */
export async function oauth(provider: 'google' | 'apple'): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Бэкенд не подключён' }
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: window.location.origin },
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true } // дальше браузер редиректит на провайдера
}

/** Отправить SMS-код на номер (вход «как WhatsApp»). */
export async function sendPhoneOtp(phone: string): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Бэкенд не подключён' }
  const { error } = await supabase.auth.signInWithOtp({ phone })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

/** Подтвердить SMS-код и войти. */
export async function verifyPhoneOtp(
  phone: string,
  token: string,
): Promise<{ ok: boolean; error?: string; profile?: ProfilePatch }> {
  if (!supabase) return { ok: false, error: 'Бэкенд не подключён' }
  const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' })
  if (error) return { ok: false, error: error.message }
  const uid = data.user?.id
  if (!uid) return { ok: false, error: 'Не удалось войти' }
  const profile = await loadProfile(uid)
  return { ok: true, profile }
}
