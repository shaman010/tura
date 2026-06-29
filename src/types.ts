export type StyleTag =
  | 'minimal'
  | 'streetwear'
  | 'casual'
  | 'classic'
  | 'evening'
  | 'sport'
  | 'korean'
  | 'luxury'
  | 'oversize'
  | 'feminine'
  | 'office'
  | 'romantic'
  | 'ethno'
  | 'modest'

export type OccasionTag =
  | 'daily'
  | 'office'
  | 'evening'
  | 'event'
  | 'walk'
  | 'travel'
  | 'home'
  | 'vacation'
  | 'wedding_guest'
  | 'holiday'

export type AgeRangeTag = '18-24' | '25-34' | '35-44' | '45-54' | '55+'
export type GenderTag = 'women' | 'men' | 'unisex'
export type SeasonTag = 'spring' | 'summer' | 'autumn' | 'winter' | 'all-season'
export type FitTag = 'slim' | 'regular' | 'loose' | 'oversize' | 'wide' | 'high-waist' | 'straight'
export type PriceSegment = 'budget' | 'middle' | 'premium'
export type ProductStatus = 'draft' | 'published' | 'hidden' | 'out_of_stock' | 'archived'
export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'hidden'
export type InspirationStatus = 'draft' | 'published' | 'hidden' | 'archived'
export type InspirationMediaType = 'image' | 'video' | 'carousel'
export type InspirationContentType =
  | 'outfit'
  | 'try_on_video'
  | 'lookbook'
  | 'size_tip'
  | 'fabric_story'
  | 'announcement'
  | 'sale'
  | 'new_collection'
  | 'behind_scenes'

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
  occasionTags?: OccasionTag[]
  ageRangeTags?: AgeRangeTag[]
  gender?: GenderTag
  seasonTags?: SeasonTag[]
  fitTags?: FitTag[]
  priceSegment?: PriceSegment
  inStock: boolean
  isActive?: boolean
}

export interface TaggedProduct {
  productId: string
  x?: number
  y?: number
  sortOrder?: number
}

export interface InspirationPost {
  id: string
  sellerId: string
  sellerName: string
  sellerSlug: string
  sellerLogoUrl?: string
  sellerWhatsApp?: string
  title?: string
  caption?: string
  contentType: InspirationContentType
  mediaType: InspirationMediaType
  mediaUrls: string[]
  coverUrl?: string
  taggedProducts: TaggedProduct[]
  styleTags: StyleTag[]
  occasionTags: OccasionTag[]
  ageRangeTags: AgeRangeTag[]
  gender: GenderTag
  seasonTags: SeasonTag[]
  isPinned: boolean
  pinnedOrder?: number
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

export type StylePreferences = Partial<Record<StyleTag | OccasionTag | AgeRangeTag | GenderTag | SeasonTag | FitTag | PriceSegment, number>>

export type UserRole = 'buyer' | 'seller' | 'admin'

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
  occasionPreferences?: StylePreferences
  ageRangePreferences?: StylePreferences
  likedProducts: string[]
  savedPosts: string[]
  followedSellerIds: string[]
  recentProductIds: string[]
  recentPostIds: string[]
  whatsappClicks: { productId?: string; postId?: string; sellerId?: string; createdAt: number }[]
  dislikedProducts: string[]
  savedProducts: string[]
  subscribedBrands: string[]
  cart: CartItem[]
  leads: Lead[]
  orders: Lead[]
  swipes: number
}
