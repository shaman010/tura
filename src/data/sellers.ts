export interface SellerInfo {
  id: string
  name: string
  slug: string
  city: string
  description: string
  whatsapp: string
  telegram: string
  instagram: string
  logo: string
  cover: string
  isActive: boolean
}

export const sellers: SellerInfo[] = [
  {
    id: 'alem',
    name: 'Alem Studio',
    slug: 'alem',
    city: 'Алматы',
    description: 'Локальный бренд одежды: легкая фактура, свободная посадка и комфорт на каждый день.',
    whatsapp: '',
    telegram: '',
    instagram: '',
    logo: '/products/product-001/cover.jpg',
    cover: '/products/product-021/cover.jpg',
    isActive: true,
  },
  {
    id: 'shoqan',
    name: 'Shoqan',
    slug: 'shoqan',
    city: 'Алматы',
    description: 'Контентная витрина образов и сезонных подборок.',
    whatsapp: '',
    telegram: '',
    instagram: '',
    logo: '/content/shoqan/p1.png',
    cover: '/content/shoqan/p2.png',
    isActive: true,
  },
  {
    id: 'moonshuaq',
    name: 'Moonshuaq',
    slug: 'moonshuaq',
    city: 'Алматы',
    description: 'Мягкие силуэты, атласная фактура и визуально спокойные образы.',
    whatsapp: '',
    telegram: '',
    instagram: '',
    logo: '/content/moonshuaq/p1.jpg',
    cover: '/content/moonshuaq/p2.jpg',
    isActive: true,
  },
  {
    id: 'shetel',
    name: 'Shetel',
    slug: 'shetel',
    city: 'Алматы',
    description: 'Кардиганы, кепки, футболки и повседневный контент бренда.',
    whatsapp: '',
    telegram: '',
    instagram: '',
    logo: '/content/shetel/p1.jpg',
    cover: '/content/shetel/p2.jpg',
    isActive: true,
  },
  {
    id: 'goldapple',
    name: 'Gold Apple',
    slug: 'goldapple',
    city: 'Алматы',
    description: 'Подборки образов и ухода в формате короткого контента.',
    whatsapp: '',
    telegram: '',
    instagram: '',
    logo: '/content/goldapple/v1.mp4',
    cover: '/content/goldapple/v2.mp4',
    isActive: true,
  },
]

export const sellerBySlug = (slug: string) => sellers.find((seller) => seller.slug === slug && seller.isActive)
export const sellerById = (id: string) => sellers.find((seller) => seller.id === id && seller.isActive)
