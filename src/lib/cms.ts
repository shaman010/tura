import { useEffect, useMemo, useState } from 'react'
import type {
  AgeRangeTag,
  FeedItem,
  FitTag,
  GenderTag,
  InspirationContentType,
  InspirationMediaType,
  InspirationPost,
  InspirationStatus,
  Lead,
  ModerationStatus,
  OccasionTag,
  PriceSegment,
  Product,
  ProductStatus,
  SeasonTag,
  StyleTag,
  TaggedProduct,
} from '../types'
import { setRuntimeData } from './runtimeData'

export type AdminSection =
  | 'dashboard'
  | 'products'
  | 'feed'
  | 'sellers'
  | 'categories'
  | 'leads'
  | 'media'
  | 'settings'

export interface CmsSeller {
  id: string
  ownerUserId: string
  ownerEmail: string
  name: string
  slug: string
  description: string
  city: string
  whatsapp: string
  telegram: string
  instagram: string
  logoUrl: string
  coverUrl: string
  isActive: boolean
  approvalStatus: 'pending' | 'approved' | 'blocked' | 'hidden'
  createdAt: string
  updatedAt: string
}

export interface CmsCategory {
  id: string
  name: string
  slug: string
  parentId: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CmsProduct {
  id: string
  sellerId: string
  categoryId: string
  title: string
  slug: string
  description: string
  price: number
  oldPrice?: number
  currency: string
  colors: { name: string; hex: string }[]
  sizes: string[]
  tags: string[]
  styleTags: StyleTag[]
  occasionTags: OccasionTag[]
  ageRangeTags: AgeRangeTag[]
  gender: GenderTag
  seasonTags: SeasonTag[]
  fitTags: FitTag[]
  priceSegment: PriceSegment | ''
  coverUrl: string
  videoUrl: string
  gallery: string[]
  status: ProductStatus
  inStock: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface CmsInspirationPost {
  id: string
  sellerId: string
  title: string
  caption: string
  contentType: InspirationContentType
  mediaType: InspirationMediaType
  mediaUrls: string[]
  coverUrl: string
  taggedProducts: TaggedProduct[]
  styleTags: StyleTag[]
  occasionTags: OccasionTag[]
  ageRangeTags: AgeRangeTag[]
  gender: GenderTag
  seasonTags: SeasonTag[]
  isPinned: boolean
  pinnedOrder: number
  publishToDiscovery: boolean
  moderationStatus: ModerationStatus
  status: InspirationStatus
  sortOrder: number
  likesCount: number
  savesCount: number
  sharesCount: number
  viewsCount: number
  createdAt: string
  updatedAt: string
}

export interface CmsProfile {
  id: string
  email: string
  role: 'buyer' | 'seller' | 'admin'
  name: string
  username: string
  avatarUrl: string
  stylePreferences: Record<string, number>
  occasionPreferences: Record<string, number>
  ageRangePreferences: Record<string, number>
  createdAt: string
  updatedAt: string
}

export interface CmsFollow {
  id: string
  buyerUserId: string
  sellerId: string
  createdAt: string
}

export interface CmsSavedProduct {
  id: string
  buyerUserId: string
  productId: string
  createdAt: string
}

export interface CmsSavedPost {
  id: string
  buyerUserId: string
  postId: string
  createdAt: string
}

export interface CmsAnalyticsEvent {
  id: string
  userId: string
  sellerId: string
  productId: string
  postId: string
  eventName: string
  source: string
  metadata: Record<string, unknown>
  createdAt: string
}

export interface CmsFeedItem {
  id: string
  productId: string
  sellerId: string
  type: 'image' | 'video'
  mediaUrl: string
  title: string
  subtitle: string
  likesCount: number
  commentsCount: number
  sharesCount: number
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CmsLead {
  id: string
  productId: string
  sellerId: string
  customerName: string
  customerPhone: string
  city: string
  selectedSize: string
  selectedColor: string
  comment: string
  source: string
  status: 'new' | 'sent_to_seller' | 'in_progress' | 'closed' | 'cancelled'
  createdAt: string
  updatedAt: string
}

export interface CmsState {
  sellers: CmsSeller[]
  categories: CmsCategory[]
  products: CmsProduct[]
  feedItems: CmsFeedItem[]
  inspirationPosts: CmsInspirationPost[]
  leads: CmsLead[]
  media: { id: string; url: string; type: 'image' | 'video'; name: string; createdAt: string }[]
  profiles: CmsProfile[]
  follows: CmsFollow[]
  savedProducts: CmsSavedProduct[]
  savedPosts: CmsSavedPost[]
  analyticsEvents: CmsAnalyticsEvent[]
}

const KEY = 'swipd-cms-state-v1'
const EVENT = 'swipd-cms-updated'
const ADMIN_SESSION_KEY = 'swipd-admin-session'
const ADMIN_TOKEN_KEY = 'swipd-admin-token'

export const emptyCmsState = (): CmsState => ({
  sellers: [],
  categories: [],
  products: [],
  feedItems: [],
  inspirationPosts: [],
  leads: [],
  media: [],
  profiles: [],
  follows: [],
  savedProducts: [],
  savedPosts: [],
  analyticsEvents: [],
})

const now = () => new Date().toISOString()
export const makeId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
export const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-+|-+$/g, '') || makeId('item')

function safeJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function normalizeCmsState(state: Partial<CmsState>): CmsState {
  return {
    ...emptyCmsState(),
    ...state,
    sellers: state.sellers ?? [],
    categories: state.categories ?? [],
    products: state.products ?? [],
    feedItems: state.feedItems ?? [],
    inspirationPosts: state.inspirationPosts ?? [],
    leads: state.leads ?? [],
    media: state.media ?? [],
    profiles: state.profiles ?? [],
    follows: state.follows ?? [],
    savedProducts: state.savedProducts ?? [],
    savedPosts: state.savedPosts ?? [],
    analyticsEvents: state.analyticsEvents ?? [],
  }
}

export function loadCmsState(): CmsState {
  const state = typeof localStorage === 'undefined' ? emptyCmsState() : safeJson(localStorage.getItem(KEY), emptyCmsState())
  return normalizeCmsState(state)
}

export function saveCmsState(next: CmsState) {
  localStorage.setItem(KEY, JSON.stringify(next))
  syncRuntime(next)
  window.dispatchEvent(new CustomEvent(EVENT))
}

function adminHeaders() {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY)
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function applyRemoteState(state: CmsState) {
  const normalized = normalizeCmsState(state)
  saveCmsState(normalized)
  return normalized
}

async function requestCms(method: 'GET' | 'POST' | 'PUT' | 'DELETE', body?: unknown) {
  const res = await fetch('/api/cms', {
    method,
    headers: { 'Content-Type': 'application/json', ...adminHeaders() } as HeadersInit,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error('CMS API request failed')
  return res.json()
}

export async function refreshCmsFromApi() {
  try {
    const state = (await requestCms('GET')) as CmsState
    return applyRemoteState(state)
  } catch {
    return loadCmsState()
  }
}

type CmsResource = keyof Pick<CmsState, 'sellers' | 'categories' | 'products' | 'feedItems' | 'inspirationPosts' | 'leads' | 'profiles' | 'follows' | 'savedProducts' | 'savedPosts' | 'analyticsEvents'>

async function pushCmsItem(resource: CmsResource, item: unknown) {
  try {
    const data = await requestCms('POST', { resource, item })
    if (data.state) await applyRemoteState(data.state)
  } catch {
    window.dispatchEvent(new CustomEvent(EVENT))
  }
}

async function deleteCmsItem(resource: CmsResource, id: string) {
  try {
    const data = await requestCms('DELETE', { resource, id })
    if (data.state) await applyRemoteState(data.state)
  } catch {
    window.dispatchEvent(new CustomEvent(EVENT))
  }
}

async function pushLeadStatus(id: string, status: CmsLead['status']) {
  try {
    const data = await requestCms('PUT', { resource: 'leads', item: { id, status } })
    if (data.state) await applyRemoteState(data.state)
  } catch {
    window.dispatchEvent(new CustomEvent(EVENT))
  }
}

export function updateCmsState(mutator: (state: CmsState) => CmsState) {
  const next = mutator(loadCmsState())
  saveCmsState(next)
  return next
}

export function clearCmsState() {
  saveCmsState(emptyCmsState())
}

export function useCmsData() {
  const [state, setState] = useState<CmsState>(() => {
    const initial = loadCmsState()
    syncRuntime(initial)
    return initial
  })
  useEffect(() => {
    refreshCmsFromApi().then((next) => setState(next)).catch(() => {})
    const refresh = () => {
      const next = loadCmsState()
      syncRuntime(next)
      setState(next)
    }
    window.addEventListener(EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])
  return state
}

export function useRuntimeCatalog() {
  const cms = useCmsData()
  return useMemo(() => toRuntimeCatalog(cms), [cms])
}

export function upsertSeller(input: Partial<CmsSeller> & { name: string; slug?: string }) {
  let saved: CmsSeller | null = null
  const next = updateCmsState((state) => {
    const existing = input.id ? state.sellers.find((seller) => seller.id === input.id) : undefined
    const stamp = now()
    const seller: CmsSeller = {
      id: existing?.id ?? input.id ?? makeId('seller'),
      ownerUserId: input.ownerUserId ?? existing?.ownerUserId ?? 'owner',
      ownerEmail: input.ownerEmail ?? existing?.ownerEmail ?? '',
      name: input.name,
      slug: input.slug || slugify(input.name),
      description: input.description ?? existing?.description ?? '',
      city: input.city ?? existing?.city ?? '',
      whatsapp: input.whatsapp ?? existing?.whatsapp ?? '',
      telegram: input.telegram ?? existing?.telegram ?? '',
      instagram: input.instagram ?? existing?.instagram ?? '',
      logoUrl: input.logoUrl ?? existing?.logoUrl ?? '',
      coverUrl: input.coverUrl ?? existing?.coverUrl ?? '',
      isActive: input.isActive ?? existing?.isActive ?? true,
      approvalStatus: input.approvalStatus ?? existing?.approvalStatus ?? 'approved',
      createdAt: existing?.createdAt ?? stamp,
      updatedAt: stamp,
    }
    saved = seller
    return { ...state, sellers: [seller, ...state.sellers.filter((item) => item.id !== seller.id)] }
  })
  if (saved) void pushCmsItem('sellers', saved)
  return next
}

export function upsertCategory(input: Partial<CmsCategory> & { name: string; slug?: string }) {
  let saved: CmsCategory | null = null
  const next = updateCmsState((state) => {
    const existing = input.id ? state.categories.find((category) => category.id === input.id) : undefined
    const stamp = now()
    const category: CmsCategory = {
      id: existing?.id ?? input.id ?? makeId('cat'),
      name: input.name,
      slug: input.slug || slugify(input.name),
      parentId: input.parentId ?? existing?.parentId ?? '',
      sortOrder: Number(input.sortOrder ?? existing?.sortOrder ?? state.categories.length),
      isActive: input.isActive ?? existing?.isActive ?? true,
      createdAt: existing?.createdAt ?? stamp,
      updatedAt: stamp,
    }
    saved = category
    return { ...state, categories: [category, ...state.categories.filter((item) => item.id !== category.id)] }
  })
  if (saved) void pushCmsItem('categories', saved)
  return next
}

export function upsertProduct(input: Partial<CmsProduct> & { title: string; sellerId: string; categoryId: string }) {
  let saved: CmsProduct | null = null
  const next = updateCmsState((state) => {
    const existing = input.id ? state.products.find((product) => product.id === input.id) : undefined
    const stamp = now()
    const product: CmsProduct = {
      id: existing?.id ?? input.id ?? makeId('product'),
      sellerId: input.sellerId,
      categoryId: input.categoryId,
      title: input.title,
      slug: input.slug || slugify(input.title),
      description: input.description ?? existing?.description ?? '',
      price: Number(input.price ?? existing?.price ?? 0),
      oldPrice: input.oldPrice ? Number(input.oldPrice) : undefined,
      currency: input.currency ?? existing?.currency ?? 'KZT',
      colors: input.colors ?? existing?.colors ?? [{ name: 'Default', hex: '#999999' }],
      sizes: input.sizes ?? existing?.sizes ?? ['XS-S', 'M-L'],
      tags: input.tags ?? existing?.tags ?? [],
      styleTags: input.styleTags ?? existing?.styleTags ?? ['casual'],
      occasionTags: input.occasionTags ?? existing?.occasionTags ?? ['daily'],
      ageRangeTags: input.ageRangeTags ?? existing?.ageRangeTags ?? ['25-34'],
      gender: input.gender ?? existing?.gender ?? 'women',
      seasonTags: input.seasonTags ?? existing?.seasonTags ?? ['all-season'],
      fitTags: input.fitTags ?? existing?.fitTags ?? ['regular'],
      priceSegment: input.priceSegment ?? existing?.priceSegment ?? 'middle',
      coverUrl: input.coverUrl ?? existing?.coverUrl ?? '',
      videoUrl: input.videoUrl ?? existing?.videoUrl ?? '',
      gallery: input.gallery ?? existing?.gallery ?? [],
      status: input.status ?? existing?.status ?? 'draft',
      inStock: input.inStock ?? existing?.inStock ?? true,
      sortOrder: Number(input.sortOrder ?? existing?.sortOrder ?? state.products.length),
      createdAt: existing?.createdAt ?? stamp,
      updatedAt: stamp,
    }
    saved = product
    return { ...state, products: [product, ...state.products.filter((item) => item.id !== product.id)] }
  })
  if (saved) void pushCmsItem('products', saved)
  return next
}

export function upsertFeedItem(input: Partial<CmsFeedItem> & { productId: string; mediaUrl: string }) {
  let saved: CmsFeedItem | null = null
  const next = updateCmsState((state) => {
    const existing = input.id ? state.feedItems.find((item) => item.id === input.id) : undefined
    const product = state.products.find((item) => item.id === input.productId)
    const stamp = now()
    const feedItem: CmsFeedItem = {
      id: existing?.id ?? input.id ?? makeId('feed'),
      productId: input.productId,
      sellerId: input.sellerId ?? product?.sellerId ?? '',
      type: input.type ?? (/\.(mp4|mov|webm)$/i.test(input.mediaUrl) ? 'video' : 'image'),
      mediaUrl: input.mediaUrl,
      title: input.title ?? product?.title ?? existing?.title ?? '',
      subtitle: input.subtitle ?? existing?.subtitle ?? '',
      likesCount: Number(input.likesCount ?? existing?.likesCount ?? 0),
      commentsCount: Number(input.commentsCount ?? existing?.commentsCount ?? 0),
      sharesCount: Number(input.sharesCount ?? existing?.sharesCount ?? 0),
      sortOrder: Number(input.sortOrder ?? existing?.sortOrder ?? state.feedItems.length),
      isActive: input.isActive ?? existing?.isActive ?? true,
      createdAt: existing?.createdAt ?? stamp,
      updatedAt: stamp,
    }
    saved = feedItem
    return { ...state, feedItems: [feedItem, ...state.feedItems.filter((item) => item.id !== feedItem.id)] }
  })
  if (saved) void pushCmsItem('feedItems', saved)
  return next
}

export function upsertInspirationPost(input: Partial<CmsInspirationPost> & { sellerId: string; mediaUrls: string[] }) {
  let saved: CmsInspirationPost | null = null
  const next = updateCmsState((state) => {
    const existing = input.id ? state.inspirationPosts.find((post) => post.id === input.id) : undefined
    const stamp = now()
    const post: CmsInspirationPost = {
      id: existing?.id ?? input.id ?? makeId('post'),
      sellerId: input.sellerId,
      title: input.title ?? existing?.title ?? '',
      caption: input.caption ?? existing?.caption ?? '',
      contentType: input.contentType ?? existing?.contentType ?? 'outfit',
      mediaType: input.mediaType ?? existing?.mediaType ?? (input.mediaUrls.length > 1 ? 'carousel' : /\.(mp4|mov|webm)$/i.test(input.mediaUrls[0] ?? '') ? 'video' : 'image'),
      mediaUrls: input.mediaUrls,
      coverUrl: input.coverUrl ?? existing?.coverUrl ?? input.mediaUrls[0] ?? '',
      taggedProducts: input.taggedProducts ?? existing?.taggedProducts ?? [],
      styleTags: input.styleTags ?? existing?.styleTags ?? ['casual'],
      occasionTags: input.occasionTags ?? existing?.occasionTags ?? ['daily'],
      ageRangeTags: input.ageRangeTags ?? existing?.ageRangeTags ?? ['25-34'],
      gender: input.gender ?? existing?.gender ?? 'women',
      seasonTags: input.seasonTags ?? existing?.seasonTags ?? ['all-season'],
      isPinned: input.isPinned ?? existing?.isPinned ?? false,
      pinnedOrder: Number(input.pinnedOrder ?? existing?.pinnedOrder ?? 0),
      publishToDiscovery: input.publishToDiscovery ?? existing?.publishToDiscovery ?? false,
      moderationStatus: input.moderationStatus ?? existing?.moderationStatus ?? (input.publishToDiscovery ? 'pending' : 'approved'),
      status: input.status ?? existing?.status ?? 'draft',
      sortOrder: Number(input.sortOrder ?? existing?.sortOrder ?? state.inspirationPosts.length),
      likesCount: Number(input.likesCount ?? existing?.likesCount ?? 0),
      savesCount: Number(input.savesCount ?? existing?.savesCount ?? 0),
      sharesCount: Number(input.sharesCount ?? existing?.sharesCount ?? 0),
      viewsCount: Number(input.viewsCount ?? existing?.viewsCount ?? 0),
      createdAt: existing?.createdAt ?? stamp,
      updatedAt: stamp,
    }
    saved = post
    return { ...state, inspirationPosts: [post, ...state.inspirationPosts.filter((item) => item.id !== post.id)] }
  })
  if (saved) void pushCmsItem('inspirationPosts', saved)
  return next
}

export function removeCmsItem(collection: keyof Pick<CmsState, 'sellers' | 'categories' | 'products' | 'feedItems' | 'inspirationPosts' | 'leads'>, id: string) {
  const next = updateCmsState((state) => ({ ...state, [collection]: (state[collection] as { id: string }[]).filter((item) => item.id !== id) }))
  void deleteCmsItem(collection, id)
  return next
}

export function createCmsLead(input: Omit<CmsLead, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: CmsLead['status'] }) {
  const stamp = now()
  const lead: CmsLead = { id: makeId('lead'), status: input.status ?? 'new', createdAt: stamp, updatedAt: stamp, ...input }
  updateCmsState((state) => ({ ...state, leads: [lead, ...state.leads] }))
  void pushCmsItem('leads', lead)
  return lead
}

export function updateLeadStatus(id: string, status: CmsLead['status']) {
  const next = updateCmsState((state) => ({
    ...state,
    leads: state.leads.map((lead) => (lead.id === id ? { ...lead, status, updatedAt: now() } : lead)),
  }))
  void pushLeadStatus(id, status)
  return next
}

export function addMedia(url: string, type: 'image' | 'video', name = '') {
  return updateCmsState((state) => ({
    ...state,
    media: [{ id: makeId('media'), url, type, name: name || url.split('/').pop() || url, createdAt: now() }, ...state.media],
  }))
}

export function trackCmsEvent(input: Partial<CmsAnalyticsEvent> & { eventName: string }) {
  const event: CmsAnalyticsEvent = {
    id: makeId('event'),
    userId: input.userId ?? '',
    sellerId: input.sellerId ?? '',
    productId: input.productId ?? '',
    postId: input.postId ?? '',
    eventName: input.eventName,
    source: input.source ?? '',
    metadata: input.metadata ?? {},
    createdAt: now(),
  }
  updateCmsState((state) => ({ ...state, analyticsEvents: [event, ...state.analyticsEvents].slice(0, 1000) }))
  void pushCmsItem('analyticsEvents', event)
  return event
}

export function toggleFollowSeller(sellerId: string, buyerUserId = 'me') {
  return updateCmsState((state) => {
    const exists = state.follows.some((follow) => follow.sellerId === sellerId && follow.buyerUserId === buyerUserId)
    return {
      ...state,
      follows: exists
        ? state.follows.filter((follow) => !(follow.sellerId === sellerId && follow.buyerUserId === buyerUserId))
        : [{ id: makeId('follow'), sellerId, buyerUserId, createdAt: now() }, ...state.follows],
    }
  })
}

export function toggleSavedPost(postId: string, buyerUserId = 'me') {
  return updateCmsState((state) => {
    const exists = state.savedPosts.some((item) => item.postId === postId && item.buyerUserId === buyerUserId)
    return {
      ...state,
      savedPosts: exists
        ? state.savedPosts.filter((item) => !(item.postId === postId && item.buyerUserId === buyerUserId))
        : [{ id: makeId('saved_post'), postId, buyerUserId, createdAt: now() }, ...state.savedPosts],
    }
  })
}

export function toRuntimeCatalog(state: CmsState) {
  const sellers = state.sellers.filter((seller) => seller.isActive)
  const categories = state.categories.filter((category) => category.isActive).sort((a, b) => a.sortOrder - b.sortOrder)
  const products = state.products
    .filter((product) => product.status === 'published' && product.inStock)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((product) => toRuntimeProduct(product, state))
    .filter(Boolean) as Product[]
  const inspirationPosts = [
    ...state.inspirationPosts,
    ...state.feedItems.map((item) => legacyFeedToPost(item, state)).filter(Boolean) as CmsInspirationPost[],
  ]
    .filter((post) => post.status === 'published')
    .sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || a.pinnedOrder - b.pinnedOrder || a.sortOrder - b.sortOrder)
    .map((post) => toRuntimePost(post, state))
    .filter(Boolean) as InspirationPost[]
  const feed = state.feedItems
    .filter((item) => item.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => toRuntimeFeedItem(item, state))
    .filter(Boolean) as FeedItem[]
  return { sellers, categories, products, feed, inspirationPosts }
}

function toRuntimeProduct(product: CmsProduct, state: CmsState): Product | null {
  const seller = state.sellers.find((item) => item.id === product.sellerId && item.isActive)
  const category = state.categories.find((item) => item.id === product.categoryId)
  if (!seller) return null
  const images = [product.coverUrl, ...product.gallery].filter(Boolean)
  return {
    id: product.id,
    title: product.title,
    brand: seller.name,
    seller: seller.name,
    sellerId: seller.id,
    sellerName: seller.name,
    sellerSlug: seller.slug,
    sellerWhatsApp: seller.whatsapp,
    sellerTelegram: seller.telegram,
    sellerInstagram: seller.instagram,
    sellerCity: seller.city,
    price: product.price,
    oldPrice: product.oldPrice,
    category: (category?.name || 'Новинки') as Product['category'],
    images: images.length ? images : [''],
    video: product.videoUrl || undefined,
    colors: product.colors,
    sizes: product.sizes,
    description: product.description,
    details: ['Наличие уточняет продавец', 'Оплата и доставка после заявки'],
    delivery: 'Оплату, наличие и доставку продавец подтвердит после заявки',
    returns: 'Условия обмена и возврата продавец уточнит после заявки',
    rating: 5,
    reviews: [],
    tags: product.tags,
    styleTags: product.styleTags,
    occasionTags: product.occasionTags,
    ageRangeTags: product.ageRangeTags,
    gender: product.gender,
    seasonTags: product.seasonTags,
    fitTags: product.fitTags,
    priceSegment: product.priceSegment || undefined,
    inStock: product.inStock,
    isActive: product.status === 'published',
  }
}

function legacyFeedToPost(item: CmsFeedItem, state: CmsState): CmsInspirationPost | null {
  const product = state.products.find((entry) => entry.id === item.productId)
  if (!product) return null
  return {
    id: `legacy_${item.id}`,
    sellerId: item.sellerId || product.sellerId,
    title: item.title || product.title,
    caption: item.subtitle || product.description,
    contentType: 'outfit',
    mediaType: item.type,
    mediaUrls: [item.mediaUrl],
    coverUrl: product.coverUrl || item.mediaUrl,
    taggedProducts: [{ productId: product.id, sortOrder: 0 }],
    styleTags: product.styleTags,
    occasionTags: product.occasionTags ?? ['daily'],
    ageRangeTags: product.ageRangeTags ?? ['25-34'],
    gender: product.gender ?? 'women',
    seasonTags: product.seasonTags ?? ['all-season'],
    isPinned: false,
    pinnedOrder: 0,
    publishToDiscovery: true,
    moderationStatus: 'approved',
    status: item.isActive ? 'published' : 'hidden',
    sortOrder: item.sortOrder,
    likesCount: item.likesCount,
    savesCount: 0,
    sharesCount: item.sharesCount,
    viewsCount: 0,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

function toRuntimePost(post: CmsInspirationPost, state: CmsState): InspirationPost | null {
  const seller = state.sellers.find((item) => item.id === post.sellerId && item.isActive)
  if (!seller) return null
  return {
    ...post,
    sellerName: seller.name,
    sellerSlug: seller.slug,
    sellerLogoUrl: seller.logoUrl,
    sellerWhatsApp: seller.whatsapp,
  }
}

function toRuntimeFeedItem(item: CmsFeedItem, state: CmsState): FeedItem | null {
  const product = state.products.find((entry) => entry.id === item.productId)
  if (!product || product.status !== 'published') return null
  return {
    id: item.id,
    type: item.type,
    productId: item.productId,
    title: item.title || product.title,
    description: item.subtitle || product.description,
    mediaUrl: item.mediaUrl,
    poster: product.coverUrl || item.mediaUrl,
    likes: item.likesCount,
    comments: item.commentsCount,
    shares: item.sharesCount,
    tags: product.tags.map((tag) => `#${tag}`),
  }
}

export function syncRuntime(state = loadCmsState()) {
  const catalog = toRuntimeCatalog(state)
  setRuntimeData(catalog.products, catalog.feed)
  return catalog
}
