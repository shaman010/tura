import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Icon } from './Icon'
import { Img } from './Img'
import { BackButton } from './BackButton'
import { useStore } from '../store/useStore'
import type { UserRole } from '../types'

const AVATARS = [
  '1494790108377-be9c29b29330', '1534528741775-53994a69daeb', '1517841905240-472988babdf9',
  '1531123897727-8f129e1688ce', '1500648767791-00dcc994a43e', '1507003211169-0a1dd7228f2d',
].map((id) => `https://images.unsplash.com/photo-${id}?w=160&q=80&auto=format&fit=crop`)

export function AuthScreen() {
  const open = useStore((s) => s.authOpen)
  return <AnimatePresence>{open && <Panel />}</AnimatePresence>
}

function Panel() {
  const close = useStore((s) => s.closeAuth)
  const register = useStore((s) => s.register)
  const signUpAccount = useStore((s) => s.signUpAccount)
  const signInAccount = useStore((s) => s.signInAccount)
  const hasBackend = useStore((s) => s.hasBackend)
  const user = useStore((s) => s.user)
  const showToast = useStore((s) => s.showToast)

  const oauthSignIn = useStore((s) => s.oauthSignIn)
  const [view, setView] = useState<'chooser' | 'email' | 'phone'>(hasBackend ? 'chooser' : 'email')
  const [mode, setMode] = useState<'register' | 'login'>('register')
  const [role, setRole] = useState<UserRole>(user.role)
  const [name, setName] = useState(user.name)
  const [username, setUsername] = useState(user.username)
  const [avatar, setAvatar] = useState(user.avatar)
  const [storeName, setStoreName] = useState(user.storeName ?? '')
  const [storeTagline, setStoreTagline] = useState(user.storeTagline ?? '')
  const [email, setEmail] = useState(user.email ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setRole(user.role)
  }, [user.role])

  const isLogin = hasBackend && mode === 'login'
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const valid = isLogin
    ? emailOk && password.length >= 6
    : name.trim().length > 1 &&
      username.trim().length > 1 &&
      (role === 'buyer' || storeName.trim().length > 1) &&
      (!hasBackend || (emailOk && password.length >= 6))

  const submit = async () => {
    if (!valid || busy) return
    setError('')

    // Демо-режим (нет бэкенда) — как раньше, локально
    if (!hasBackend) {
      register({ role, name: name.trim(), username: username.trim(), avatar, storeName: storeName.trim(), storeTagline: storeTagline.trim() })
      showToast(role === 'seller' ? 'Аккаунт продавца создан' : 'Аккаунт обновлён')
      return
    }

    setBusy(true)
    try {
      if (isLogin) {
        const r = await signInAccount(email.trim(), password)
        if (!r.ok) { setError(translateError(r.error)); return }
        showToast('Вы вошли')
      } else {
        const r = await signUpAccount({
          email: email.trim(), password,
          role, name: name.trim(), username: username.trim(), avatar,
          storeName: storeName.trim() || undefined, storeTagline: storeTagline.trim() || undefined,
        })
        if (!r.ok) { setError(translateError(r.error)); return }
        if (r.needsConfirm) { setError('Подтвердите email по ссылке из письма, затем войдите.'); setMode('login'); return }
        showToast(role === 'seller' ? 'Магазин создан' : 'Аккаунт создан')
      }
    } finally {
      setBusy(false)
    }
  }

  const doOauth = async (p: 'google' | 'apple') => {
    setError('')
    const r = await oauthSignIn(p)
    if (!r.ok) {
      const raw = (r.error ?? '').toLowerCase()
      setError(raw.includes('provider') || raw.includes('not enabled') || raw.includes('unsupported')
        ? `Вход через ${p === 'google' ? 'Google' : 'Apple'} ещё не включён в Supabase (Authentication → Providers).`
        : translateError(r.error))
    }
  }

  // Экран выбора способа входа
  if (view === 'chooser') {
    return (
      <Shell onClose={close}>
        <div className="flex flex-1 flex-col">
          {/* яркий герой */}
          <div className="relative -mx-5 mb-2 overflow-hidden rounded-b-[36px] px-5 pb-8 pt-4">
            <div className="absolute inset-0 -z-10 opacity-90" style={{ background: 'linear-gradient(150deg,#FF2D7A 0%,#D91D62 38%,#7C5CFF 78%,#4AA8FF 100%)' }} />
            <div className="absolute -right-10 -top-12 -z-10 h-44 w-44 rounded-full bg-white/25 blur-2xl" />
            <div className="absolute -left-8 top-10 -z-10 h-32 w-32 rounded-full bg-[#FFA24B]/40 blur-2xl" />
            <div className="inline-flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
              <Icon name="sparkles" size={14} /> Swipd
            </div>
            <h1 className="mt-5 font-display text-[34px] font-black leading-[1.05] text-white drop-shadow-sm">
              Заходи и<br />покупай из видео
            </h1>
            <p className="mt-2 max-w-[300px] text-sm font-medium text-white/85">
              Один аккаунт — лента, корзина и заказы локальных магазинов в одном месте.
            </p>
          </div>

          <div className="mt-4 space-y-2.5">
            <ProviderBtn icon="google" label="Продолжить с Google" tone="bg-white text-black" onClick={() => doOauth('google')} />
            <ProviderBtn icon="apple" label="Продолжить с Apple ID" dark onClick={() => doOauth('apple')} />
            <ProviderBtn icon="phone" label="Войти по номеру телефона" tone="bg-[#25D366] text-white" onClick={() => { setError(''); setView('phone') }} />
            <ProviderBtn icon="mail" label="Email и пароль" tone="bg-grad-accent text-white" onClick={() => { setError(''); setView('email') }} />
          </div>

          {error && <p className="mt-5 rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</p>}

          <div className="flex-1" />
          <p className="pt-6 text-center text-xs text-muted">
            Продолжая, ты соглашаешься с условиями и политикой конфиденциальности Swipd.
          </p>
        </div>
      </Shell>
    )
  }

  // Вход по номеру телефона (SMS-код, как в WhatsApp)
  if (view === 'phone') {
    return <PhoneFlow onBack={() => setView('chooser')} onClose={close} />
  }

  return (
    <Shell onClose={hasBackend ? () => setView('chooser') : close} closeIcon={hasBackend ? 'chevronLeft' : 'close'}>
      <div className="flex items-center justify-between pb-4">
        <h1 className="text-2xl font-extrabold">{isLogin ? 'Вход' : 'Создать аккаунт'}</h1>
      </div>

        {/* register / login toggle (только при подключённом бэкенде) */}
        {hasBackend && (
          <div className="mb-5 flex rounded-2xl bg-ink/[0.06] p-1 text-sm font-semibold">
            <button
              onClick={() => { setMode('register'); setError('') }}
              className={`flex-1 rounded-xl py-2 transition ${!isLogin ? 'bg-grad-accent text-ink' : 'text-muted'}`}
            >Регистрация</button>
            <button
              onClick={() => { setMode('login'); setError('') }}
              className={`flex-1 rounded-xl py-2 transition ${isLogin ? 'bg-grad-accent text-ink' : 'text-muted'}`}
            >Вход</button>
          </div>
        )}

        {/* role choice — только при регистрации */}
        {!isLogin && (
          <div className="grid grid-cols-2 gap-3">
            <RoleCard active={role === 'buyer'} onClick={() => setRole('buyer')} icon="user" title="Покупатель" sub="Свайпай и покупай образы" />
            <RoleCard active={role === 'seller'} onClick={() => setRole('seller')} icon="store" title="Продавец" sub="Открой свой магазин" />
          </div>
        )}

        {/* avatar — только при регистрации */}
        {!isLogin && (
          <div className="mt-6">
            <div className="mb-2 text-xs font-semibold text-muted">Аватар</div>
            <div className="flex flex-wrap gap-2.5">
              {AVATARS.map((url) => (
                <button
                  key={url}
                  onClick={() => setAvatar(url)}
                  className={`h-12 w-12 overflow-hidden rounded-full border-2 transition ${avatar === url ? 'border-magenta' : 'border-ink/10'}`}
                >
                  <Img src={url} alt="" fallbackLabel="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 space-y-3">
          {hasBackend && (
            <>
              <Field label="Email" value={email} onChange={setEmail} placeholder="you@mail.com" type="email" />
              <Field label="Пароль" value={password} onChange={setPassword} placeholder="минимум 6 символов" type="password" />
            </>
          )}

          {!isLogin && (
            <>
              <Field label="Имя" value={name} onChange={setName} placeholder="Как вас зовут" />
              <Field label="Username" value={username} onChange={setUsername} placeholder="@username" />
              {role === 'seller' && (
                <>
                  <Field label="Название магазина" value={storeName} onChange={setStoreName} placeholder="Например, ATELIER NORD" />
                  <Field label="Слоган (необязательно)" value={storeTagline} onChange={setStoreTagline} placeholder="Минимализм и лён" />
                </>
              )}
            </>
          )}
        </div>

        {error && <p className="mt-4 rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</p>}

        <div className="flex-1" />
        <button
          onClick={submit}
          disabled={!valid || busy}
          className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-grad-accent font-bold text-ink shadow-glow active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
        >
          {busy ? 'Подождите…' : <><Icon name="check" size={20} /> {isLogin ? 'Войти' : role === 'seller' ? 'Создать магазин' : 'Готово'}</>}
        </button>
        <p className="mt-3 text-center text-xs text-ink/40">
          {hasBackend ? 'Регистрация в защищённой базе Supabase' : 'Демо-регистрация — данные хранятся в браузере'}
        </p>
    </Shell>
  )
}

/** Общая обёртка экрана авторизации (фон, контейнер, кнопка закрытия). */
function Shell({ children, onClose, closeIcon = 'close' }: { children: ReactNode; onClose: () => void; closeIcon?: 'close' | 'chevronLeft' }) {
  return (
    <motion.div
      className="fixed inset-0 z-[92] flex justify-center bg-base text-ink"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="no-scrollbar relative flex h-full w-full max-w-[480px] flex-col overflow-y-auto px-5 pb-8"
        style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 16px)' }}
      >
        <div className="flex justify-end pb-2">
          <BackButton onClick={onClose} icon={closeIcon} label="Назад" />
        </div>
        {children}
      </div>
    </motion.div>
  )
}

function ProviderBtn({ icon, label, onClick, tone, dark }: { icon: 'google' | 'apple' | 'phone' | 'mail'; label: string; onClick: () => void; tone?: string; dark?: boolean }) {
  const chip = tone ?? (dark ? 'bg-white text-black' : 'bg-ink/10 text-ink')
  return (
    <button
      onClick={onClick}
      className={`flex h-[60px] w-full items-center gap-3 rounded-2xl border px-3 text-[15px] font-bold transition active:scale-[0.98] ${
        dark ? 'border-black bg-black text-white' : 'border-line bg-card text-ink shadow-island'
      }`}
    >
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${chip}`}>
        <Icon name={icon} size={20} />
      </span>
      <span className="flex-1 text-left">{label}</span>
      <Icon name="chevronRight" size={18} className="opacity-30" />
    </button>
  )
}

/** Вход по номеру телефона через SMS-код (Supabase OTP). */
function PhoneFlow({ onBack, onClose }: { onBack: () => void; onClose: () => void }) {
  const sendOtp = useStore((s) => s.sendOtp)
  const verifyOtp = useStore((s) => s.verifyOtp)
  const showToast = useStore((s) => s.showToast)
  const [stage, setStage] = useState<'phone' | 'code'>('phone')
  const [phone, setPhone] = useState('+7')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const phoneOk = /^\+\d{10,15}$/.test(phone.trim())

  const send = async () => {
    if (!phoneOk || busy) return
    setBusy(true); setError('')
    const r = await sendOtp(phone.trim())
    setBusy(false)
    if (!r.ok) {
      const raw = (r.error ?? '').toLowerCase()
      setError(raw.includes('provider') || raw.includes('not') || raw.includes('sms') || raw.includes('disabled')
        ? 'SMS-вход ещё не настроен в Supabase (нужен SMS-провайдер: Twilio/Vonage). Пока используй Email.'
        : r.error || 'Не удалось отправить код')
      return
    }
    setStage('code')
  }

  const verify = async () => {
    if (code.trim().length < 4 || busy) return
    setBusy(true); setError('')
    const r = await verifyOtp(phone.trim(), code.trim())
    setBusy(false)
    if (!r.ok) { setError(r.error || 'Неверный код'); return }
    showToast('Вы вошли')
  }

  return (
    <Shell onClose={stage === 'code' ? () => setStage('phone') : onBack} closeIcon="chevronLeft">
      <div className="pt-2">
        <h1 className="font-display text-3xl font-black leading-tight">
          {stage === 'phone' ? 'Твой номер' : 'Введи код'}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {stage === 'phone' ? 'Пришлём SMS с кодом подтверждения.' : `Код отправлен на ${phone}`}
        </p>
      </div>

      <div className="mt-7 space-y-3">
        {stage === 'phone' ? (
          <Field label="Номер телефона" value={phone} onChange={setPhone} placeholder="+7 700 000 00 00" type="tel" />
        ) : (
          <Field label="Код из SMS" value={code} onChange={setCode} placeholder="• • • • • •" type="tel" />
        )}
      </div>

      {error && <p className="mt-4 rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</p>}

      <div className="flex-1" />
      <button
        onClick={stage === 'phone' ? send : verify}
        disabled={busy || (stage === 'phone' ? !phoneOk : code.trim().length < 4)}
        className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-grad-accent font-bold text-ink shadow-glow active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
      >
        {busy ? 'Подождите…' : stage === 'phone' ? 'Получить код' : 'Войти'}
      </button>
      <button onClick={onClose} className="mt-3 h-10 w-full text-sm font-semibold text-muted">Отмена</button>
    </Shell>
  )
}

function RoleCard({ active, onClick, icon, title, sub }: { active: boolean; onClick: () => void; icon: 'user' | 'store'; title: string; sub: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start gap-2 rounded-3xl border p-4 text-left transition active:scale-[0.98] ${
        active ? 'border-magenta bg-magenta/10' : 'border-ink/10 bg-ink/[0.04]'
      }`}
    >
      <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${active ? 'bg-grad-accent' : 'bg-ink/[0.06]'} text-ink`}>
        <Icon name={icon} size={22} />
      </span>
      <span className="text-base font-bold">{title}</span>
      <span className="text-xs text-muted">{sub}</span>
    </button>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-muted">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        autoCapitalize="none"
        autoCorrect="off"
        className="h-12 rounded-2xl bg-ink/[0.06] px-4 text-[15px] text-ink outline-none focus:ring-2 focus:ring-magenta/40"
      />
    </label>
  )
}

function translateError(msg?: string): string {
  if (!msg) return 'Что-то пошло не так. Попробуйте ещё раз.'
  const m = msg.toLowerCase()
  if (m.includes('rate limit')) return 'Лимит писем Supabase исчерпан. Выключите «Confirm email» в настройках Supabase — и регистрация заработает сразу.'
  if (m.includes('already registered') || m.includes('already exists') || m.includes('user already')) return 'Этот email уже зарегистрирован — войдите через вкладку «Вход».'
  if (m.includes('signups') && m.includes('disabled')) return 'Регистрация по email отключена в Supabase — включите её в настройках.'
  if (m.includes('invalid login') || m.includes('invalid credentials')) return 'Неверный email или пароль.'
  if (m.includes('password')) return 'Пароль слишком короткий (минимум 6 символов).'
  if (m.includes('is invalid') || (m.includes('email') && m.includes('invalid'))) return 'Этот email Supabase считает недопустимым — используйте реальный ящик (gmail, mail.ru).'
  return msg
}
