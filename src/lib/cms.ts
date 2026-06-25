import { useEffect, useMemo, useState } from 'react'
import type { FeedItem, Lead, Product, StyleTag } from '../types'
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
  coverUrl: string
  videoUrl: string
  gallery: string[]
  status: 'draft' | 'published' | 'archived'
  inStock: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
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
  leads: CmsLead[]
  media: { id: string; url: string; type: 'image' | 'video'; name: string; createdAt: string }[]
}

const KEY = 'swipd-cms-state-v1'
const EVENT = 'swipd-cms-updated'

export const emptyCmsState = (): CmsState => ({
  sellers: [],
  categories: [],
  products: [],
  feedItems: [],
  leads: [],
  media: [],
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

export function loadCmsState(): CmsState {
  const state = typeof localStorage === 'undefined' ? emptyCmsState() : safeJson(localStorage.getItem(KEY), emptyCmsState())
  return {
    ...emptyCmsState(),
    ...state,
    sellers: state.sellers ?? [],
    categories: state.categories ?? [],
    products: state.products ?? [],
    feedItems: state.feedItems ?? [],
    leads: state.leads ?? [],
    media: state.media ?? [],
  }
}

export function saveCmsState(next: CmsState) {
  localStorage.setItem(KEY, JSON.stringify(next))
  syncRuntime(next)
  window.dispatchEvent(new CustomEvent(EVENT))
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
  return updateCmsState((state) => {
    const existing = input.id ? state.sellers.find((seller) => seller.id === input.id) : undefined
    const stamp = now()
    const seller: CmsSeller = {
      id: existing?.id ?? input.id ?? makeId('seller'),
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
      createdAt: existing?.createdAt ?? stamp,
      updatedAt: stamp,
    }
    return { ...state, sellers: [seller, ...state.sellers.filter((item) => item.id !== seller.id)] }
  })
}

export function upsertCategory(input: Partial<CmsCategory> & { name: string; slug?: string }) {
  return updateCmsState((state) => {
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
    return { ...state, categories: [category, ...state.categories.filter((item) => item.id !== category.id)] }
  })
}

export function upsertProduct(input: Partial<CmsProduct> & { title: string; sellerId: string; categoryId: string }) {
  return updateCmsState((state) => {
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
      coverUrl: input.coverUrl ?? existing?.coverUrl ?? '',
      videoUrl: input.videoUrl ?? existing?.videoUrl ?? '',
      gallery: input.gallery ?? existing?.gallery ?? [],
      status: input.status ?? existing?.status ?? 'draft',
      inStock: input.inStock ?? existing?.inStock ?? true,
      sortOrder: Number(input.sortOrder ?? existing?.sortOrder ?? state.products.length),
      createdAt: existing?.createdAt ?? stamp,
      updatedAt: stamp,
    }
    return { ...state, products: [product, ...state.products.filter((item) => item.id !== product.id)] }
  })
}

export function upsertFeedItem(input: Partial<CmsFeedItem> & { productId: string; mediaUrl: string }) {
  return updateCmsState((state) => {
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
    return { ...state, feedItems: [feedItem, ...state.feedItems.filter((item) => item.id !== feedItem.id)] }
  })
}

export function removeCmsItem(collection: keyof Pick<CmsState, 'sellers' | 'categories' | 'products' | 'feedItems' | 'leads'>, id: string) {
  return updateCmsState((state) => ({ ...state, [collection]: (state[collection] as { id: string }[]).filter((item) => item.id !== id) }))
}

export function createCmsLead(input: Omit<CmsLead, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: CmsLead['status'] }) {
  const stamp = now()
  const lead: CmsLead = { id: makeId('lead'), status: input.status ?? 'new', createdAt: stamp, updatedAt: stamp, ...input }
  updateCmsState((state) => ({ ...state, leads: [lead, ...state.leads] }))
  return lead
}

export function updateLeadStatus(id: string, status: CmsLead['status']) {
  return updateCmsState((state) => ({
    ...state,
    leads: state.leads.map((lead) => (lead.id === id ? { ...lead, status, updatedAt: now() } : lead)),
  }))
}

export function addMedia(url: string, type: 'image' | 'video', name = '') {
  return updateCmsState((state) => ({
    ...state,
    media: [{ id: makeId('media'), url, type, name: name || url.split('/').pop() || url, createdAt: now() }, ...state.media],
  }))
}

export function toRuntimeCatalog(state: CmsState) {
  const sellers = state.sellers.filter((seller) => seller.isActive)
  const categories = state.categories.filter((category) => category.isActive).sort((a, b) => a.sortOrder - b.sortOrder)
  const products = state.products
    .filter((product) => product.status === 'published' && product.inStock)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((product) => toRuntimeProduct(product, state))
    .filter(Boolean) as Product[]
  const feed = state.feedItems
    .filter((item) => item.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => toRuntimeFeedItem(item, state))
    .filter(Boolean) as FeedItem[]
  return { sellers, categories, products, feed }
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
    inStock: product.inStock,
    isActive: product.status === 'published',
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
