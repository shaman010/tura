export type StyleTag =
  | 'minimal'
  | 'streetwear'
  | 'casual'
  | 'classic'
  | 'sport'
  | 'korean'
  | 'luxury'
  | 'oversize'
  | 'feminine'
  | 'office'

export type Category =
  | 'Новинки'
  | 'Верх'
  | 'Низ'
  | 'Обувь'
  | 'Аксессуары'
  | 'Образы'
  | 'Тренды'
  | 'Sale'

export type Fit = 'slim' | 'regular' | 'oversize'

export interface Review {
  id: string
  author: string
  avatar: string
  rating: number
  text: string
  photo?: string
  likes: number
  date: string
}

export interface Product {
  id: string
  title: string
  brand: string
  seller: string
  sellerId: string
  sellerName: string
  sellerSlug: string
  sellerWhatsApp?: string
  sellerTelegram?: string
  sellerInstagram?: string
  sellerCity?: string
  price: number
  oldPrice?: number
  category: Category
  images: string[]
  video?: string
  colors: { name: string; hex: string }[]
  sizes: string[]
  description: string
  details: string[]
  delivery: string
  returns: string
  rating: number
  reviews: Review[]
  tags: string[]
  styleTags: StyleTag[]
  inStock: boolean
  isActive?: boolean
}

export interface FeedItem {
  id: string
  type: 'image' | 'video'
  productId: string
  title: string
  description: string
  mediaUrl: string
  /** постер для видео (показывается до/вместо видео, если файла нет) */
  poster?: string
  likes: number
  comments: number
  shares: number
  tags: string[]
  revealPriceOnTap?: boolean
}

export interface Sizes {
  height?: string
  weight?: string
  top?: string
  bottom?: string
  shoe?: string
  fit?: Fit
}

export interface Address {
  id: string
  label: string
  city: string
  street: string
  recipient: string
  phone: string
}

export interface CartItem {
  productId: string
  selectedSize: string
  selectedColor: string
  quantity: number
  selected: boolean
}

export type LeadStatus = 'Отправлена' | 'Продавец получил' | 'В обработке' | 'Закрыта'

export interface LeadItem {
  productId: string
  productTitle: string
  productImage: string
  size: string
  color: string
  qty: number
  price: number
}

export interface Lead {
  id: string
  date: string
  createdAt: number
  items: LeadItem[]
  total: number
  status: LeadStatus
  sellerId: string
  sellerName: string
  sellerWhatsApp?: string
  source: string
  customer: { name: string; phone: string; city: string; comment: string }
}

export type OrderStatus = LeadStatus
export type Order = Lead

export type StylePreferences = Record<StyleTag, number>

export type UserRole = 'buyer' | 'seller'

export interface UserProfile {
  id: string
  name: string
  username: string
  avatar: string
  email?: string
  role: UserRole
  storeName?: string
  storeTagline?: string
  sizes: Sizes
  addresses: Address[]
  stylePreferences: StylePreferences
  likedProducts: string[]
  dislikedProducts: string[]
  savedProducts: string[]
  subscribedBrands: string[]
  cart: CartItem[]
  leads: Lead[]
  orders: Lead[]
  swipes: number
}
