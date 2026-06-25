import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Address,
  CartItem,
  Lead,
  Order,
  OrderStatus,
  Sizes,
  StylePreferences,
  StyleTag,
  UserProfile,
  UserRole,
} from '../types'

export interface CheckoutMeta {
  customer: Lead['customer']
  source?: string
}
import { applySignal, emptyPreferences, WEIGHTS } from '../lib/recommendations'
import { productById } from '../data/products'
import { tgSend, formatOrderMessage } from '../lib/telegram'
import { track } from '../lib/analytics'
import { createCmsLead } from '../lib/cms'
import { safeRemoveFromStorage } from '../lib/storage'
import * as auth from '../lib/auth'
import { hasBackend } from '../lib/supabase'

function notifyLead(lead: Lead) {
  tgSend(formatOrderMessage(lead)).catch(() => {})
}

export type Tab = 'discovery' | 'search' | 'cart' | 'account'

interface UIState {
  onboarded: boolean
  tab: Tab
  // overlay: открытая карточка товара поверх всего
  openProductId: string | null
  checkoutOpen: boolean
  checkoutSource: string
  // кабинет продавца (overlay)
  sellerOpen: boolean
  // какие товары уходят в форму заявки
  checkoutItemIds: string[]
  toast: string | null
  // целевая вкладка профиля (например, открыть «Мои заявки» после формы)
  accountSection: string | null
  // открытый магазин бренда (overlay)
  storeBrand: string | null
  // экран настроек (overlay)
  settingsOpen: boolean
  // экран регистрации/смены роли (overlay)
  authOpen: boolean
  // звук видео в ленте
  videoMuted: boolean
  // тема оформления
  theme: 'dark' | 'light'
  // вошёл ли пользователь в реальный бэкенд (Supabase)
  authed: boolean
  // «улетающий» в корзину товар (микроанимация)
  fly: { url: string; x: number; y: number; key: number } | null
}

interface StoreState extends UIState {
  user: UserProfile
  // actions — onboarding
  completeOnboarding: (styles: StyleTag[], sizes?: Sizes) => void
  resetAll: () => void
  // navigation
  setTab: (t: Tab) => void
  goToAccountSection: (section: string) => void
  clearAccountSection: () => void
  openStore: (brand: string) => void
  closeStore: () => void
  openSettings: () => void
  closeSettings: () => void
  openAuth: () => void
  closeAuth: () => void
  toggleMute: () => void
  setTheme: (t: 'dark' | 'light') => void
  toggleTheme: () => void
  register: (data: {
    role: UserRole
    name: string
    username: string
    avatar?: string
    storeName?: string
    storeTagline?: string
  }) => void
  // real backend auth (Supabase)
  hasBackend: boolean
  signUpAccount: (data: auth.SignUpInput) => Promise<{ ok: boolean; error?: string; needsConfirm?: boolean }>
  signInAccount: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  signOutAccount: () => Promise<void>
  hydrateSession: () => Promise<void>
  oauthSignIn: (provider: 'google' | 'apple') => Promise<{ ok: boolean; error?: string }>
  sendOtp: (phone: string) => Promise<{ ok: boolean; error?: string }>
  verifyOtp: (phone: string, token: string) => Promise<{ ok: boolean; error?: string }>
  toggleSubscribe: (brand: string) => void
  openProduct: (id: string) => void
  closeProduct: () => void
  openCheckout: (productIds: string[], source?: string) => void
  closeCheckout: () => void
  openSeller: () => void
  closeSeller: () => void
  buyNow: (productId: string, size: string, color: string, source?: string) => void
  showToast: (msg: string) => void
  flyToCart: (url: string, x: number, y: number) => void
  // signals (swipes / taps)
  like: (productId: string) => void
  dislike: (productId: string) => void
  save: (productId: string) => void
  toggleSave: (productId: string) => void
  registerSwipe: () => void
  // cart
  addToCart: (productId: string, size: string, color: string) => void
  removeFromCart: (productId: string) => void
  setQty: (productId: string, qty: number) => void
  updateCartVariant: (productId: string, size: string, color: string) => void
  toggleCartSelected: (productId: string) => void
  selectAllCart: (selected: boolean) => void
  // checkout
  submitLead: (productIds: string[], meta: CheckoutMeta) => Lead[]
  placeOrder: (productIds: string[], meta: CheckoutMeta) => Lead
  // seller CRM
  updateOrderStatus: (orderId: string, status: OrderStatus) => void
  seedDemoOrder: () => void
  // profile
  updateProfile: (patch: { name?: string; username?: string; avatar?: string }) => void
  updateSizes: (sizes: Sizes) => void
  addAddress: (a: Omit<Address, 'id'>) => void
  updateAddress: (a: Address) => void
  removeAddress: (id: string) => void
}

function freshUser(): UserProfile {
  return {
    id: 'me',
    name: 'Алия',
    username: '@aliya.style',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&q=80&auto=format&fit=crop',
    role: 'buyer',
    sizes: {},
    addresses: [],
    stylePreferences: emptyPreferences(),
    likedProducts: [],
    dislikedProducts: [],
    savedProducts: [],
    subscribedBrands: [],
    cart: [],
    leads: [],
    orders: [],
    swipes: 0,
  }
}

function bump(
  prefs: StylePreferences,
  productId: string,
  weight: number,
): StylePreferences {
  const p = productById(productId)
  if (!p) return prefs
  return applySignal(prefs, p.styleTags, weight)
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      onboarded: false,
      tab: 'discovery',
      openProductId: null,
      checkoutOpen: false,
      checkoutSource: 'product_page',
      sellerOpen: false,
      checkoutItemIds: [],
      toast: null,
      accountSection: null,
      storeBrand: null,
      settingsOpen: false,
      authOpen: false,
      videoMuted: true,
      theme: 'dark',
      authed: false,
      hasBackend,
      fly: null,
      user: freshUser(),

      flyToCart: (url, x, y) => set({ fly: { url, x, y, key: Date.now() } }),

      completeOnboarding: (styles, sizes) =>
        set((s) => {
          let prefs = { ...s.user.stylePreferences }
          // выбранные при онбординге стили задают стартовые веса
          for (const tag of styles) prefs[tag] = (prefs[tag] ?? 0) + 6
          return {
            onboarded: true,
            tab: 'discovery',
            user: { ...s.user, stylePreferences: prefs, sizes: sizes ?? s.user.sizes },
          }
        }),

      resetAll: () => {
        safeRemoveFromStorage('swipd-hints-seen')
        set({
          onboarded: false,
          tab: 'discovery',
          openProductId: null,
          checkoutOpen: false,
          checkoutSource: 'product_page',
          sellerOpen: false,
          checkoutItemIds: [],
          toast: null,
          accountSection: null,
          storeBrand: null,
          settingsOpen: false,
          authOpen: false,
          user: freshUser(),
        })
      },

      setTab: (t) => set({ tab: t }),
      goToAccountSection: (section) => set({ tab: 'account', accountSection: section }),
      clearAccountSection: () => set({ accountSection: null }),
      openStore: (brand) => set({ storeBrand: brand }),
      closeStore: () => set({ storeBrand: null }),
      openSettings: () => set({ settingsOpen: true }),
      closeSettings: () => set({ settingsOpen: false }),
      openAuth: () => set({ authOpen: true }),
      closeAuth: () => set({ authOpen: false }),
      toggleMute: () => set((s) => ({ videoMuted: !s.videoMuted })),
      setTheme: (t) => set({ theme: t }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      register: (data) =>
        set((s) => ({
          authOpen: false,
          user: {
            ...s.user,
            name: data.name || s.user.name,
            username: data.username.startsWith('@') ? data.username : '@' + data.username.replace(/^@+/, ''),
            avatar: data.avatar || s.user.avatar,
            role: data.role,
            storeName: data.role === 'seller' ? data.storeName : undefined,
            storeTagline: data.role === 'seller' ? data.storeTagline : undefined,
          },
        })),
      signUpAccount: async (data) => {
        const res = await auth.signUp(data)
        if (res.ok && res.profile) {
          set((s) => ({ authed: true, authOpen: false, user: { ...s.user, ...res.profile } }))
        }
        return { ok: res.ok, error: res.error, needsConfirm: res.needsConfirm }
      },
      signInAccount: async (email, password) => {
        const res = await auth.signIn(email, password)
        if (res.ok && res.profile) {
          set((s) => ({ authed: true, authOpen: false, user: { ...s.user, ...res.profile } }))
        }
        return { ok: res.ok, error: res.error }
      },
      signOutAccount: async () => {
        await auth.signOut()
        set({ authed: false })
      },
      hydrateSession: async () => {
        const profile = await auth.currentProfile()
        if (profile) set((s) => ({ authed: true, user: { ...s.user, ...profile } }))
      },
      oauthSignIn: async (provider) => auth.oauth(provider),
      sendOtp: async (phone) => auth.sendPhoneOtp(phone),
      verifyOtp: async (phone, token) => {
        const res = await auth.verifyPhoneOtp(phone, token)
        if (res.ok && res.profile) set((s) => ({ authed: true, authOpen: false, user: { ...s.user, ...res.profile } }))
        return { ok: res.ok, error: res.error }
      },
      toggleSubscribe: (brand) =>
        set((s) => {
          const subbed = s.user.subscribedBrands.includes(brand)
          return {
            user: {
              ...s.user,
              subscribedBrands: subbed
                ? s.user.subscribedBrands.filter((b) => b !== brand)
                : [...s.user.subscribedBrands, brand],
            },
          }
        }),
      openProduct: (id) => {
        track('product_opened', { productId: id })
        set({ openProductId: id })
      },
      closeProduct: () => set({ openProductId: null }),
      openCheckout: (productIds, source = 'product_page') => {
        track('lead_form_opened', { count: productIds.length, source })
        set({ checkoutOpen: true, checkoutItemIds: productIds, checkoutSource: source })
      },
      closeCheckout: () => set({ checkoutOpen: false }),
      openSeller: () => set({ sellerOpen: true }),
      closeSeller: () => set({ sellerOpen: false }),
      buyNow: (productId, size, color, source = 'product_page') => {
        track('lead_form_opened', { productId, source })
        get().addToCart(productId, size, color)
        set({ checkoutOpen: true, checkoutItemIds: [productId], checkoutSource: source, openProductId: null })
      },
      showToast: (msg) => {
        set({ toast: msg })
        window.clearTimeout((window as any).__toastT)
        ;(window as any).__toastT = window.setTimeout(() => set({ toast: null }), 2200)
      },

      registerSwipe: () => set((s) => ({ user: { ...s.user, swipes: s.user.swipes + 1 } })),

      like: (productId) =>
        set((s) => {
          track('swipe_right', { productId })
          const liked = s.user.likedProducts.includes(productId)
            ? s.user.likedProducts
            : [...s.user.likedProducts, productId]
          const saved = s.user.savedProducts.includes(productId)
            ? s.user.savedProducts
            : [...s.user.savedProducts, productId]
          const disliked = s.user.dislikedProducts.filter((id) => id !== productId)
          return {
            user: {
              ...s.user,
              likedProducts: liked,
              savedProducts: saved,
              dislikedProducts: disliked,
              stylePreferences: bump(s.user.stylePreferences, productId, WEIGHTS.like),
            },
          }
        }),

      dislike: (productId) =>
        set((s) => {
          track('swipe_left', { productId })
          const disliked = s.user.dislikedProducts.includes(productId)
            ? s.user.dislikedProducts
            : [...s.user.dislikedProducts, productId]
          return {
            user: {
              ...s.user,
              dislikedProducts: disliked,
              likedProducts: s.user.likedProducts.filter((id) => id !== productId),
              savedProducts: s.user.savedProducts.filter((id) => id !== productId),
              stylePreferences: bump(s.user.stylePreferences, productId, WEIGHTS.dislike),
            },
          }
        }),

      save: (productId) =>
        set((s) => {
          if (s.user.savedProducts.includes(productId)) return s
          track('product_saved', { productId })
          return {
            user: {
              ...s.user,
              savedProducts: [...s.user.savedProducts, productId],
              stylePreferences: bump(s.user.stylePreferences, productId, WEIGHTS.save),
            },
          }
        }),

      toggleSave: (productId) => {
        const s = get()
        if (s.user.savedProducts.includes(productId)) {
          set({
            user: {
              ...s.user,
              savedProducts: s.user.savedProducts.filter((id) => id !== productId),
            },
          })
        } else {
          get().save(productId)
        }
      },

      addToCart: (productId, size, color) =>
        set((s) => {
          track('favorite_added', { productId, size, color })
          const existing = s.user.cart.find(
            (c) => c.productId === productId && c.selectedSize === size && c.selectedColor === color,
          )
          let cart: CartItem[]
          if (existing) {
            cart = s.user.cart.map((c) =>
              c === existing ? { ...c, quantity: c.quantity + 1 } : c,
            )
          } else {
            cart = [
              ...s.user.cart,
              { productId, selectedSize: size, selectedColor: color, quantity: 1, selected: true },
            ]
          }
          return {
            user: {
              ...s.user,
              cart,
              stylePreferences: bump(s.user.stylePreferences, productId, WEIGHTS.cart),
            },
          }
        }),

      removeFromCart: (productId) =>
        set((s) => ({
          user: { ...s.user, cart: s.user.cart.filter((c) => c.productId !== productId) },
        })),

      setQty: (productId, qty) =>
        set((s) => ({
          user: {
            ...s.user,
            cart: s.user.cart.map((c) =>
              c.productId === productId ? { ...c, quantity: Math.max(1, qty) } : c,
            ),
          },
        })),

      updateCartVariant: (productId, size, color) =>
        set((s) => ({
          user: {
            ...s.user,
            cart: s.user.cart.map((c) =>
              c.productId === productId ? { ...c, selectedSize: size, selectedColor: color } : c,
            ),
          },
        })),

      toggleCartSelected: (productId) =>
        set((s) => ({
          user: {
            ...s.user,
            cart: s.user.cart.map((c) =>
              c.productId === productId ? { ...c, selected: !c.selected } : c,
            ),
          },
        })),

      selectAllCart: (selected) =>
        set((s) => ({
          user: { ...s.user, cart: s.user.cart.map((c) => ({ ...c, selected })) },
        })),

      submitLead: (productIds, meta) => {
        const s = get()
        const items = s.user.cart.filter((c) => productIds.includes(c.productId))
        const bySeller = new Map<string, CartItem[]>()
        items.forEach((item) => {
          const p = productById(item.productId)
          if (!p) return
          const group = bySeller.get(p.sellerId) ?? []
          group.push(item)
          bySeller.set(p.sellerId, group)
        })
        const createdAt = Date.now()
        const leads: Lead[] = Array.from(bySeller.entries()).map(([sellerId, sellerItems], index) => {
          const firstProduct = productById(sellerItems[0].productId)!
          const leadItems = sellerItems
            .map((c) => {
              const p = productById(c.productId)
              if (!p) return null
              return {
                productId: p.id,
                productTitle: p.title,
                productImage: p.images[0],
                size: c.selectedSize,
                color: c.selectedColor,
                qty: c.quantity,
                price: p.price,
              }
            })
            .filter(Boolean) as Lead['items']
          return {
            id: 'l' + createdAt.toString(36) + (index ? '-' + index : ''),
            date: new Date(createdAt).toLocaleDateString('ru-RU'),
            createdAt: createdAt + index,
            items: leadItems,
            total: leadItems.reduce((sum, item) => sum + item.price * item.qty, 0),
            status: 'Отправлена',
            sellerId,
            sellerName: firstProduct.sellerName,
            sellerWhatsApp: firstProduct.sellerWhatsApp,
            source: meta.source ?? s.checkoutSource,
            customer: meta.customer,
          }
        })
        let prefs = s.user.stylePreferences
        for (const c of items) prefs = bump(prefs, c.productId, WEIGHTS.purchase)
        set({
          user: {
            ...s.user,
            leads: [...leads, ...(s.user.leads ?? s.user.orders ?? [])],
            orders: [...leads, ...(s.user.orders ?? [])],
            cart: s.user.cart.filter((c) => !productIds.includes(c.productId)),
            stylePreferences: prefs,
          },
        })
        leads.forEach((lead) => {
          lead.items.forEach((item) => {
            createCmsLead({
              productId: item.productId,
              sellerId: lead.sellerId,
              customerName: lead.customer.name,
              customerPhone: lead.customer.phone,
              city: lead.customer.city,
              selectedSize: item.size,
              selectedColor: item.color,
              comment: lead.customer.comment,
              source: lead.source,
            })
          })
          track('lead_submitted', {
            leadId: lead.id,
            sellerId: lead.sellerId,
            source: lead.source,
            items: lead.items.length,
          })
          notifyLead(lead)
        })
        return leads
      },

      placeOrder: (productIds, meta) => {
        const leads = get().submitLead(productIds, meta)
        return leads[0]
      },

      updateOrderStatus: (orderId, status) =>
        set((s) => ({
          user: {
            ...s.user,
            leads: (s.user.leads ?? []).map((o) => (o.id === orderId ? { ...o, status } : o)),
            orders: s.user.orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
          },
        })),

      seedDemoOrder: () =>
        set((s) => {
          const demos = [
            {
              names: ['Иван Покупатель', '+7 701 234 56 78', 'Алматы', 'Абая 10, кв 5'],
              picks: [
                { productId: 'product-001', size: 'M-L', color: 'Айвори', qty: 1 },
                { productId: 'product-005', size: 'M-L', color: 'Коричневый', qty: 1 },
              ],
              status: 'Отправлена' as OrderStatus,
            },
            {
              names: ['Айгерим С.', '+7 702 987 65 43', 'Астана', 'Достык 5'],
              picks: [{ productId: 'product-021', size: 'XS-S', color: 'Розовый', qty: 1 }],
              status: 'В обработке' as OrderStatus,
            },
          ]
          const d = demos[s.user.orders.length % demos.length]
          const total = d.picks.reduce((sum, it) => {
            const p = productById(it.productId)
            return sum + (p ? p.price * it.qty : 0)
          }, 0)
          const order: Order = {
            id: 'o' + Date.now().toString(36),
            date: new Date().toLocaleDateString('ru-RU'),
            createdAt: Date.now(),
            items: d.picks.map((it) => {
              const p = productById(it.productId)!
              return {
                productId: it.productId,
                productTitle: p.title,
                productImage: p.images[0],
                size: it.size,
                color: it.color,
                qty: it.qty,
                price: p.price,
              }
            }),
            total,
            status: 'Отправлена',
            sellerId: 'alem',
            sellerName: 'Alem Studio',
            sellerWhatsApp: '',
            source: 'demo',
            customer: { name: d.names[0], phone: d.names[1], city: d.names[2], comment: d.names[3] },
          }
          notifyLead(order)
          return { user: { ...s.user, leads: [order, ...(s.user.leads ?? [])], orders: [order, ...s.user.orders] } }
        }),

      updateProfile: (patch) => set((s) => ({ user: { ...s.user, ...patch } })),

      updateSizes: (sizes) => set((s) => ({ user: { ...s.user, sizes } })),

      addAddress: (a) =>
        set((s) => ({
          user: {
            ...s.user,
            addresses: [...s.user.addresses, { ...a, id: 'a' + Date.now().toString(36) }],
          },
        })),

      updateAddress: (a) =>
        set((s) => ({
          user: {
            ...s.user,
            addresses: s.user.addresses.map((x) => (x.id === a.id ? a : x)),
          },
        })),

      removeAddress: (id) =>
        set((s) => ({
          user: { ...s.user, addresses: s.user.addresses.filter((x) => x.id !== id) },
        })),
    }),
    {
      name: 'swipd-store',
      version: 1,
      partialize: (s) => ({ onboarded: s.onboarded, user: s.user, theme: s.theme }),
      // Гарантируем полную форму user даже если в localStorage старое/битое
      // состояние — иначе обращение к undefined-полю (cart/orders/...) роняет
      // весь рендер и «страницы пропадают».
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<StoreState>
        const pu = (p.user ?? {}) as Partial<UserProfile>
        const arr = <T,>(v: unknown, fallback: T[]): T[] => (Array.isArray(v) ? (v as T[]) : fallback)
        const base = current.user
        return {
          ...current,
          onboarded: typeof p.onboarded === 'boolean' ? p.onboarded : current.onboarded,
          user: {
            ...base,
            ...pu,
            sizes: { ...base.sizes, ...(pu.sizes ?? {}) },
            stylePreferences: { ...base.stylePreferences, ...(pu.stylePreferences ?? {}) },
            cart: arr(pu.cart, base.cart),
            leads: arr(pu.leads, arr(pu.orders, base.leads)),
            orders: arr(pu.orders, arr(pu.leads, base.orders)),
            savedProducts: arr(pu.savedProducts, base.savedProducts),
            subscribedBrands: arr(pu.subscribedBrands, base.subscribedBrands),
            likedProducts: arr(pu.likedProducts, base.likedProducts),
            dislikedProducts: arr(pu.dislikedProducts, base.dislikedProducts),
            addresses: arr(pu.addresses, base.addresses),
          },
        }
      },
    },
  ),
)

export const cartCount = (cart?: CartItem[]) =>
  (cart ?? []).reduce((n, c) => n + c.quantity, 0)
