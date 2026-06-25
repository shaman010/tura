/* Импорт реального контента из "Контент 01": копирует медиа в public/content/<slug>,
   оставляет Alem, заменяет демо-магазины на Shoqan / Moonshuaq / Shetél / Gold Apple,
   деривирует ленту. Запуск: node scripts/gen-content.cjs */
const fs = require('fs')
const path = require('path')

const SRC = 'C:/Users/dias_/OneDrive/Desktop/Контент 01'
const ROOT = path.resolve(__dirname, '..')
const PUB = path.join(ROOT, 'public', 'content')

// --- конфигурация магазинов ---
const BRANDS = [
  {
    slug: 'shoqan', dir: 'Shoqan suits', name: 'Shoqan', seller: 'Shoqan Suits',
    tagline: 'Костюмы ручной работы · Almaty', basePrice: 95000,
    color: { name: 'Графит', hex: '#3A3A40' }, style: ['classic', 'luxury', 'office'],
    catVideo: 'Образы', catImage: 'Образы', tags: ['shoqan', 'костюм', 'премиум'],
    desc: 'Костюм ручной работы от Shoqan Suits — премиальные ткани и силуэт.',
  },
  {
    slug: 'moonshuaq', dir: 'Moonshuaq', name: 'Moonshuaq', seller: 'Moonshuaq',
    tagline: 'Oversized блейзеры · 100% мақта', basePrice: 50000,
    color: { name: 'Кремовый', hex: '#E9DEC8' }, style: ['minimal', 'oversize', 'casual'],
    catVideo: 'Верх', catImage: 'Верх', tags: ['moonshuaq', 'блейзер', 'oversize'],
    desc: 'Oversized блейзер из 100% хлопка. Унисекс, размеры M и XL.',
  },
  {
    slug: 'shetel', dir: 'Shetel', name: 'Shetél', seller: 'Shetél',
    tagline: 'Кардиганы, кепки, футболки', basePrice: 15000,
    color: { name: 'Молочный', hex: '#EFE9DF' }, style: ['casual', 'streetwear', 'minimal'],
    catVideo: 'Верх', catImage: 'Верх', tags: ['shetel', 'casual', 'лето'],
    desc: 'Лёгкие модели Shetél — доставка по всему Казахстану.',
  },
  {
    slug: 'goldapple', dir: 'Золотое яблоко', name: 'Gold Apple', seller: 'Gold Apple',
    tagline: 'Бьюти и уход · goldapple_kz', basePrice: 9900,
    color: { name: 'Розовый', hex: '#E9A6C0' }, style: ['feminine', 'luxury', 'classic'],
    catVideo: 'Образы', catImage: 'Образы', tags: ['goldapple', 'бьюти', 'уход'],
    desc: 'Бьюти-образ и уход из Gold Apple.',
  },
]

const isVid = (f) => /\.(mp4|mov|webm)$/i.test(f)
const isImg = (f) => /\.(jpg|jpeg|png)$/i.test(f)

fs.rmSync(PUB, { recursive: true, force: true })
fs.mkdirSync(PUB, { recursive: true })

const products = []
const brandInfos = []

for (const b of BRANDS) {
  const srcDir = path.join(SRC, b.dir)
  const files = fs.readdirSync(srcDir).filter((f) => isVid(f) || isImg(f))
  const stat = (f) => fs.statSync(path.join(srcDir, f)).size
  const videos = files.filter(isVid).sort()
  // крупные изображения = реальные фото товара (мелкие иконки отбрасываем как постеры)
  const images = files.filter(isImg).sort((a, z) => stat(z) - stat(a))

  const outDir = path.join(PUB, b.slug)
  fs.mkdirSync(outDir, { recursive: true })

  const vOut = videos.map((f, i) => {
    const name = `v${i + 1}` + path.extname(f).toLowerCase()
    fs.copyFileSync(path.join(srcDir, f), path.join(outDir, name))
    return `/content/${b.slug}/${name}`
  })
  const iOut = images.map((f, i) => {
    const name = `p${i + 1}` + path.extname(f).toLowerCase()
    fs.copyFileSync(path.join(srcDir, f), path.join(outDir, name))
    return `/content/${b.slug}/${name}`
  })

  const poster = iOut[0] // лучший кадр-постер для видео (мгновенная карточка)
  let n = 0

  // видео-товары (постер = реальное фото, если есть)
  vOut.forEach((v, i) => {
    n++
    products.push({
      id: `${b.slug}-${n}`,
      title: `${b.name} · образ ${i + 1}`,
      brand: b.name, seller: b.seller,
      price: b.basePrice + i * 1000,
      category: b.catVideo,
      images: [poster || v],
      video: v,
      colors: [b.color], sizes: ['XS-S', 'M-L'],
      description: b.desc,
      details: ['Видео-обзор', 'Реальная съёмка', 'Доставка по Казахстану'],
      rating: 4.8, tags: b.tags, styleTags: b.style,
    })
  })

  // фото-товары из крупных изображений (быстрые карточки)
  iOut.filter((_, i) => stat(images[i]) >= 90000).slice(0, 4).forEach((img, i) => {
    n++
    products.push({
      id: `${b.slug}-${n}`,
      title: `${b.name} · модель ${i + 1}`,
      brand: b.name, seller: b.seller,
      price: b.basePrice + i * 500,
      category: b.catImage,
      images: [img],
      colors: [b.color], sizes: ['XS-S', 'M-L'],
      description: b.desc,
      details: ['Реальное фото', 'Ограниченная партия', 'Доставка по Казахстану'],
      rating: 4.9, tags: b.tags, styleTags: b.style,
    })
  })

  brandInfos.push({ name: b.name, tagline: b.tagline, cover: poster || vOut[0] })
}

// --- сериализация TS ---
const ser = (p) => `  {
    id: ${JSON.stringify(p.id)},
    title: ${JSON.stringify(p.title)},
    brand: ${JSON.stringify(p.brand)},
    seller: ${JSON.stringify(p.seller)},
    price: ${p.price},
    category: ${JSON.stringify(p.category)},
    images: ${JSON.stringify(p.images)},${p.video ? `\n    video: ${JSON.stringify(p.video)},` : ''}
    colors: ${JSON.stringify(p.colors)},
    sizes: ${JSON.stringify(p.sizes)},
    description: ${JSON.stringify(p.description)},
    details: ${JSON.stringify(p.details)},
    delivery: "Доставка по Алматы 1–2 дня · по Казахстану 1–4 дня",
    returns: "Возврат и обмен 14 дней",
    rating: ${p.rating},
    reviews: [],
    tags: ${JSON.stringify(p.tags)},
    styleTags: ${JSON.stringify(p.styleTags)},
    inStock: true,
  },`

// --- переписываем products.ts: оставляем Alem, заменяем не-Alem блок ---
const pPath = path.join(ROOT, 'src', 'data', 'products.ts')
let text = fs.readFileSync(pPath, 'utf8')
const start = text.indexOf('\n  {\n    id: "nova-1"')
const alem = text.slice(0, start)

const brandsTs = brandInfos
  .map((b) => `  { name: ${JSON.stringify(b.name)}, tagline: ${JSON.stringify(b.tagline)}, cover: ${JSON.stringify(b.cover)} },`)
  .join('\n')

const tail = `
${products.map(ser).join('\n')}
]

export const productById = (id: string) => PRODUCTS.find((p) => p.id === id)
export const productsByBrand = (brand: string) => PRODUCTS.filter((p) => p.brand === brand)

export interface BrandInfo {
  name: string
  tagline: string
  cover: string
}
export const BRANDS: BrandInfo[] = [
  { name: 'Alem', tagline: 'Лён и атлас · Almaty', cover: '/products/product-021/cover.jpg' },
${brandsTs}
]
`
fs.writeFileSync(pPath, alem + tail, 'utf8')

// --- feed.ts: деривируем из PRODUCTS, перемешивая видео и фото ---
const feedTs = `import type { FeedItem } from '../types'
import { PRODUCTS } from './products'

// Лента деривируется из каталога: видео и фото перемешаны для «живого» скролла.
const hash = (s: string) => {
  let x = 0
  for (let i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) >>> 0
  return x
}

const toItem = (p: (typeof PRODUCTS)[number]): FeedItem => {
  const isVideo = !!p.video
  const seed = hash(p.id)
  return {
    id: 'f-' + p.id,
    type: isVideo ? 'video' : 'image',
    productId: p.id,
    title: p.title,
    description: p.description,
    mediaUrl: isVideo ? (p.video as string) : p.images[0],
    poster: p.images[0],
    likes: 800 + (seed % 9200),
    comments: 8 + (seed % 470),
    shares: 4 + (seed % 180),
    tags: (p.tags || []).slice(0, 3).map((t) => '#' + t.replace(/\\s+/g, '')),
  }
}

const videos = PRODUCTS.filter((p) => p.video).map(toItem)
const images = PRODUCTS.filter((p) => !p.video).map(toItem)

// вставляем видео каждые 3 фото
const FEED_BUILD: FeedItem[] = []
let vi = 0
images.forEach((it, i) => {
  FEED_BUILD.push(it)
  if ((i + 1) % 3 === 0 && vi < videos.length) FEED_BUILD.push(videos[vi++])
})
while (vi < videos.length) FEED_BUILD.push(videos[vi++])

export const FEED: FeedItem[] = FEED_BUILD
`
fs.writeFileSync(path.join(ROOT, 'src', 'data', 'feed.ts'), feedTs, 'utf8')

console.log('Products:', products.length, '| brands:', brandInfos.map((b) => b.name).join(', '))
console.log('Media → public/content/{shoqan,moonshuaq,shetel,goldapple}')
