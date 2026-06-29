import type { InspirationPost, Product } from '../types'
import { track } from './analytics'
import { trackCmsEvent } from './cms'
import { tenge } from './format'

export function sellerWhatsappUrl({
  product,
  post,
  size,
  color,
  source,
}: {
  product: Product
  post?: InspirationPost
  size?: string
  color?: string
  source: string
}) {
  const phone = product.sellerWhatsApp?.replace(/\D/g, '')
  if (!phone) return ''
  const productUrl = `${window.location.origin}/product/${product.id}`
  const postUrl = post ? `${window.location.origin}/post/${post.id}` : ''
  const message = [
    'Здравствуйте! Хочу уточнить наличие товара:',
    '',
    `Товар: ${product.title}`,
    `Размер: ${size || product.sizes[0] || '-'}`,
    `Цвет: ${color || product.colors[0]?.name || '-'}`,
    `Цена: ${tenge(product.price)}`,
    `Ссылка: ${productUrl}`,
    postUrl ? `Образ: ${postUrl}` : '',
    '',
    'Подскажите, есть ли в наличии?',
  ].filter(Boolean).join('\n')
  track('whatsapp_clicked', { productId: product.id, sellerId: product.sellerId, postId: post?.id, source })
  trackCmsEvent({
    eventName: 'whatsapp_clicked',
    productId: product.id,
    sellerId: product.sellerId,
    postId: post?.id ?? '',
    source,
    metadata: { size, color },
  })
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

export function openSellerWhatsapp(args: Parameters<typeof sellerWhatsappUrl>[0], onMissing?: () => void) {
  const url = sellerWhatsappUrl(args)
  if (!url) {
    onMissing?.()
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}
