import { d1Query, id, isAdminRequest, json, parseJson } from './_lib/cloudflare'

const stamp = () => new Date().toISOString()

function rowSeller(row: any) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description || '',
    city: row.city || '',
    whatsapp: row.whatsapp || '',
    telegram: row.telegram || '',
    instagram: row.instagram || '',
    logoUrl: row.logo_url || '',
    coverUrl: row.cover_url || '',
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function rowCategory(row: any) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    parentId: row.parent_id || '',
    sortOrder: Number(row.sort_order || 0),
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function rowProduct(row: any, gallery: any[]) {
  return {
    id: row.id,
    sellerId: row.seller_id,
    categoryId: row.category_id || '',
    title: row.title,
    slug: row.slug || '',
    description: row.description || '',
    price: Number(row.price || 0),
    oldPrice: row.old_price ? Number(row.old_price) : undefined,
    currency: row.currency || 'KZT',
    colors: parseJson(row.colors, []),
    sizes: parseJson(row.sizes, []),
    tags: parseJson(row.tags, []),
    styleTags: parseJson(row.style_tags, []),
    coverUrl: row.cover_url || '',
    videoUrl: row.video_url || '',
    gallery: gallery.filter((media) => media.product_id === row.id && media.usage === 'gallery').sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0)).map((media) => media.url),
    status: row.status || 'draft',
    inStock: Boolean(row.in_stock),
    sortOrder: Number(row.sort_order || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function rowFeedItem(row: any) {
  return {
    id: row.id,
    productId: row.product_id,
    sellerId: row.seller_id,
    type: row.type,
    mediaUrl: row.media_url,
    title: row.title || '',
    subtitle: row.subtitle || '',
    likesCount: Number(row.likes_count || 0),
    commentsCount: Number(row.comments_count || 0),
    sharesCount: Number(row.shares_count || 0),
    sortOrder: Number(row.sort_order || 0),
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function rowLead(row: any) {
  return {
    id: row.id,
    productId: row.product_id || '',
    sellerId: row.seller_id || '',
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    city: row.city || '',
    selectedSize: row.selected_size || '',
    selectedColor: row.selected_color || '',
    comment: row.comment || '',
    source: row.source || '',
    status: row.status || 'new',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function getState() {
  const [sellers, categories, mediaRows, productRows, feedItems, leads] = await Promise.all([
    d1Query('SELECT * FROM sellers ORDER BY created_at DESC'),
    d1Query('SELECT * FROM categories ORDER BY sort_order ASC, created_at DESC'),
    d1Query('SELECT * FROM product_media ORDER BY sort_order ASC, created_at DESC'),
    d1Query('SELECT * FROM products ORDER BY sort_order ASC, created_at DESC'),
    d1Query('SELECT * FROM feed_items ORDER BY sort_order ASC, created_at DESC'),
    d1Query('SELECT * FROM leads ORDER BY created_at DESC'),
  ])
  return {
    sellers: sellers.map(rowSeller),
    categories: categories.map(rowCategory),
    products: productRows.map((row) => rowProduct(row, mediaRows)),
    feedItems: feedItems.map(rowFeedItem),
    leads: leads.map(rowLead),
    media: mediaRows.map((row: any) => ({ id: row.id, url: row.url, type: row.media_type, name: row.alt || row.url.split('/').pop() || row.url, createdAt: row.created_at })),
  }
}

async function upsertSeller(item: any) {
  const now = stamp()
  await d1Query(
    `INSERT INTO sellers (id, name, slug, description, city, whatsapp, telegram, instagram, logo_url, cover_url, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), ?)
     ON CONFLICT(id) DO UPDATE SET name=excluded.name, slug=excluded.slug, description=excluded.description, city=excluded.city, whatsapp=excluded.whatsapp, telegram=excluded.telegram, instagram=excluded.instagram, logo_url=excluded.logo_url, cover_url=excluded.cover_url, is_active=excluded.is_active, updated_at=excluded.updated_at`,
    [item.id, item.name, item.slug, item.description || '', item.city || '', item.whatsapp || '', item.telegram || '', item.instagram || '', item.logoUrl || '', item.coverUrl || '', item.isActive ? 1 : 0, item.createdAt || now, now],
  )
}

async function upsertCategory(item: any) {
  const now = stamp()
  await d1Query(
    `INSERT INTO categories (id, name, slug, parent_id, sort_order, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), ?)
     ON CONFLICT(id) DO UPDATE SET name=excluded.name, slug=excluded.slug, parent_id=excluded.parent_id, sort_order=excluded.sort_order, is_active=excluded.is_active, updated_at=excluded.updated_at`,
    [item.id, item.name, item.slug, item.parentId || '', Number(item.sortOrder || 0), item.isActive ? 1 : 0, item.createdAt || now, now],
  )
}

async function upsertProduct(item: any) {
  const now = stamp()
  await d1Query(
    `INSERT INTO products (id, seller_id, category_id, title, slug, description, price, old_price, currency, colors, sizes, tags, style_tags, cover_url, video_url, status, in_stock, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), ?)
     ON CONFLICT(id) DO UPDATE SET seller_id=excluded.seller_id, category_id=excluded.category_id, title=excluded.title, slug=excluded.slug, description=excluded.description, price=excluded.price, old_price=excluded.old_price, currency=excluded.currency, colors=excluded.colors, sizes=excluded.sizes, tags=excluded.tags, style_tags=excluded.style_tags, cover_url=excluded.cover_url, video_url=excluded.video_url, status=excluded.status, in_stock=excluded.in_stock, sort_order=excluded.sort_order, updated_at=excluded.updated_at`,
    [item.id, item.sellerId, item.categoryId || '', item.title, item.slug || '', item.description || '', Number(item.price || 0), item.oldPrice ? Number(item.oldPrice) : null, item.currency || 'KZT', json(item.colors), json(item.sizes), json(item.tags), json(item.styleTags), item.coverUrl || '', item.videoUrl || '', item.status || 'draft', item.inStock ? 1 : 0, Number(item.sortOrder || 0), item.createdAt || now, now],
  )
  await d1Query('DELETE FROM product_media WHERE product_id = ? AND usage = ?', [item.id, 'gallery'])
  const gallery = Array.isArray(item.gallery) ? item.gallery : []
  for (const [index, url] of gallery.entries()) {
    await d1Query('INSERT INTO product_media (id, product_id, media_type, url, usage, alt, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [
      id('media'),
      item.id,
      /\.(mp4|mov|webm)$/i.test(url) ? 'video' : 'image',
      url,
      'gallery',
      item.title || '',
      index,
      now,
    ])
  }
}

async function upsertFeedItem(item: any) {
  const now = stamp()
  await d1Query(
    `INSERT INTO feed_items (id, product_id, seller_id, type, media_url, title, subtitle, likes_count, comments_count, shares_count, sort_order, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), ?)
     ON CONFLICT(id) DO UPDATE SET product_id=excluded.product_id, seller_id=excluded.seller_id, type=excluded.type, media_url=excluded.media_url, title=excluded.title, subtitle=excluded.subtitle, likes_count=excluded.likes_count, comments_count=excluded.comments_count, shares_count=excluded.shares_count, sort_order=excluded.sort_order, is_active=excluded.is_active, updated_at=excluded.updated_at`,
    [item.id, item.productId, item.sellerId || '', item.type || 'image', item.mediaUrl, item.title || '', item.subtitle || '', Number(item.likesCount || 0), Number(item.commentsCount || 0), Number(item.sharesCount || 0), Number(item.sortOrder || 0), item.isActive ? 1 : 0, item.createdAt || now, now],
  )
}

async function createLead(item: any) {
  const now = stamp()
  await d1Query(
    `INSERT INTO leads (id, product_id, seller_id, customer_name, customer_phone, city, selected_size, selected_color, comment, source, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), ?)`,
    [item.id || id('lead'), item.productId || item.product_id || '', item.sellerId || item.seller_id || '', item.customerName || item.customer_name, item.customerPhone || item.customer_phone, item.city || '', item.selectedSize || item.selected_size || '', item.selectedColor || item.selected_color || '', item.comment || '', item.source || '', item.status || 'new', item.createdAt || now, now],
  )
}

async function updateLead(item: any) {
  await d1Query('UPDATE leads SET status = ?, updated_at = ? WHERE id = ?', [item.status, stamp(), item.id])
}

async function deleteItem(resource: string, idValue: string) {
  const table: Record<string, string> = {
    sellers: 'sellers',
    categories: 'categories',
    products: 'products',
    feedItems: 'feed_items',
    leads: 'leads',
  }
  if (!table[resource]) throw new Error('Unknown resource')
  await d1Query(`DELETE FROM ${table[resource]} WHERE id = ?`, [idValue])
}

async function upsertResource(resource: string, item: any) {
  if (resource === 'sellers') return upsertSeller(item)
  if (resource === 'categories') return upsertCategory(item)
  if (resource === 'products') return upsertProduct(item)
  if (resource === 'feedItems') return upsertFeedItem(item)
  if (resource === 'leads') return createLead(item)
  throw new Error('Unknown resource')
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method === 'GET') return res.status(200).json(await getState())

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
    const isPublicLead = req.method === 'POST' && body.resource === 'leads'
    if (!isPublicLead && !isAdminRequest(req)) return res.status(401).json({ ok: false, error: 'Unauthorized' })

    if (req.method === 'POST') {
      await upsertResource(body.resource, body.item)
      return res.status(200).json({ ok: true, state: await getState() })
    }
    if (req.method === 'PUT') {
      if (body.resource !== 'leads') throw new Error('Only lead status updates use PUT')
      await updateLead(body.item)
      return res.status(200).json({ ok: true, state: await getState() })
    }
    if (req.method === 'DELETE') {
      await deleteItem(body.resource, body.id)
      return res.status(200).json({ ok: true, state: await getState() })
    }
    return res.status(405).json({ ok: false })
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error?.message || 'API error' })
  }
}
