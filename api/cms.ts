import { d1Query, id, isAdminRequest, json, parseJson } from './_lib/cloudflare'

const stamp = () => new Date().toISOString()
const empty = <T,>() => [] as T[]

async function safeQuery<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
  try {
    return await d1Query<T>(sql, params)
  } catch (error) {
    const message = String((error as Error)?.message || '')
    if (/no such table|no such column|SQLITE_ERROR/i.test(message)) return empty<T>()
    throw error
  }
}

const array = (value: unknown, fallback: any[] = []) => parseJson(value, fallback)
const bool = (value: unknown, fallback = false) => (value == null ? fallback : Boolean(Number(value)))

function rowSeller(row: any) {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id || 'owner',
    ownerEmail: row.owner_email || '',
    name: row.name,
    slug: row.slug,
    description: row.description || '',
    city: row.city || '',
    whatsapp: row.whatsapp || '',
    telegram: row.telegram || '',
    instagram: row.instagram || '',
    logoUrl: row.logo_url || '',
    coverUrl: row.cover_url || '',
    isActive: bool(row.is_active, true),
    approvalStatus: row.approval_status || 'approved',
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
    isActive: bool(row.is_active, true),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function rowProduct(row: any, galleryRows: any[]) {
  const galleryFromMedia = galleryRows
    .filter((media) => media.product_id === row.id && media.usage === 'gallery')
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
    .map((media) => media.url)

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
    colors: array(row.colors, []),
    sizes: array(row.sizes, []),
    tags: array(row.tags, []),
    styleTags: array(row.style_tags, ['casual']),
    occasionTags: array(row.occasion_tags, ['daily']),
    ageRangeTags: array(row.age_range_tags, ['25-34']),
    gender: row.gender || 'women',
    seasonTags: array(row.season_tags, ['all-season']),
    fitTags: array(row.fit_tags, ['regular']),
    priceSegment: row.price_segment || 'middle',
    coverUrl: row.cover_url || '',
    videoUrl: row.video_url || '',
    gallery: array(row.gallery_urls, galleryFromMedia),
    status: row.status || 'draft',
    inStock: bool(row.in_stock, true),
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
    isActive: bool(row.is_active, true),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function rowInspirationPost(row: any, taggedRows: any[]) {
  return {
    id: row.id,
    sellerId: row.seller_id,
    title: row.title || '',
    caption: row.caption || '',
    contentType: row.content_type || 'outfit',
    mediaType: row.media_type || 'image',
    mediaUrls: array(row.media_urls, []),
    coverUrl: row.cover_url || '',
    taggedProducts: taggedRows
      .filter((item) => item.post_id === row.id)
      .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
      .map((item) => ({ productId: item.product_id, x: item.x, y: item.y, sortOrder: Number(item.sort_order || 0) })),
    styleTags: array(row.style_tags, ['casual']),
    occasionTags: array(row.occasion_tags, ['daily']),
    ageRangeTags: array(row.age_range_tags, ['25-34']),
    gender: row.gender || 'women',
    seasonTags: array(row.season_tags, ['all-season']),
    isPinned: bool(row.is_pinned),
    pinnedOrder: Number(row.pinned_order || 0),
    publishToDiscovery: bool(row.publish_to_discovery),
    moderationStatus: row.moderation_status || 'pending',
    status: row.status || 'draft',
    sortOrder: Number(row.sort_order || 0),
    likesCount: Number(row.likes_count || 0),
    savesCount: Number(row.saves_count || 0),
    sharesCount: Number(row.shares_count || 0),
    viewsCount: Number(row.views_count || 0),
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

function rowProfile(row: any) {
  return {
    id: row.id,
    email: row.email || '',
    role: row.role || 'buyer',
    name: row.name || '',
    username: row.username || '',
    avatarUrl: row.avatar_url || '',
    stylePreferences: parseJson(row.style_preferences, {}),
    occasionPreferences: parseJson(row.occasion_preferences, {}),
    ageRangePreferences: parseJson(row.age_range_preferences, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function rowAnalyticsEvent(row: any) {
  return {
    id: row.id,
    userId: row.user_id || '',
    sellerId: row.seller_id || '',
    productId: row.product_id || '',
    postId: row.post_id || '',
    eventName: row.event_name,
    source: row.source || '',
    metadata: parseJson(row.metadata, {}),
    createdAt: row.created_at,
  }
}

async function getState() {
  const [sellers, categories, mediaRows, productRows, feedItems, leads, postRows, taggedRows, profiles, follows, savedProducts, savedPosts, analyticsEvents] = await Promise.all([
    safeQuery('SELECT * FROM sellers ORDER BY created_at DESC'),
    safeQuery('SELECT * FROM categories ORDER BY sort_order ASC, created_at DESC'),
    safeQuery('SELECT * FROM product_media ORDER BY sort_order ASC, created_at DESC'),
    safeQuery('SELECT * FROM products ORDER BY sort_order ASC, created_at DESC'),
    safeQuery('SELECT * FROM feed_items ORDER BY sort_order ASC, created_at DESC'),
    safeQuery('SELECT * FROM leads ORDER BY created_at DESC'),
    safeQuery('SELECT * FROM inspiration_posts ORDER BY is_pinned DESC, pinned_order ASC, sort_order ASC, created_at DESC'),
    safeQuery('SELECT * FROM inspiration_post_products ORDER BY sort_order ASC, created_at DESC'),
    safeQuery('SELECT * FROM profiles ORDER BY created_at DESC'),
    safeQuery('SELECT * FROM follows ORDER BY created_at DESC'),
    safeQuery('SELECT * FROM saved_products ORDER BY created_at DESC'),
    safeQuery('SELECT * FROM saved_posts ORDER BY created_at DESC'),
    safeQuery('SELECT * FROM analytics_events ORDER BY created_at DESC LIMIT 1000'),
  ])

  return {
    sellers: sellers.map(rowSeller),
    categories: categories.map(rowCategory),
    products: productRows.map((row) => rowProduct(row, mediaRows)),
    feedItems: feedItems.map(rowFeedItem),
    inspirationPosts: postRows.map((row) => rowInspirationPost(row, taggedRows)),
    leads: leads.map(rowLead),
    media: mediaRows.map((row: any) => ({ id: row.id, url: row.url, type: row.media_type, name: row.alt || row.url.split('/').pop() || row.url, createdAt: row.created_at })),
    profiles: profiles.map(rowProfile),
    follows: follows.map((row: any) => ({ id: row.id, buyerUserId: row.buyer_user_id, sellerId: row.seller_id, createdAt: row.created_at })),
    savedProducts: savedProducts.map((row: any) => ({ id: row.id, buyerUserId: row.buyer_user_id, productId: row.product_id, createdAt: row.created_at })),
    savedPosts: savedPosts.map((row: any) => ({ id: row.id, buyerUserId: row.buyer_user_id, postId: row.post_id, createdAt: row.created_at })),
    analyticsEvents: analyticsEvents.map(rowAnalyticsEvent),
  }
}

async function upsertSeller(item: any) {
  const now = stamp()
  await d1Query(
    `INSERT INTO sellers (id, owner_user_id, owner_email, name, slug, description, city, whatsapp, telegram, instagram, logo_url, cover_url, is_active, approval_status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), ?)
     ON CONFLICT(id) DO UPDATE SET owner_user_id=excluded.owner_user_id, owner_email=excluded.owner_email, name=excluded.name, slug=excluded.slug, description=excluded.description, city=excluded.city, whatsapp=excluded.whatsapp, telegram=excluded.telegram, instagram=excluded.instagram, logo_url=excluded.logo_url, cover_url=excluded.cover_url, is_active=excluded.is_active, approval_status=excluded.approval_status, updated_at=excluded.updated_at`,
    [item.id, item.ownerUserId || 'owner', item.ownerEmail || '', item.name, item.slug, item.description || '', item.city || '', item.whatsapp || '', item.telegram || '', item.instagram || '', item.logoUrl || '', item.coverUrl || '', item.isActive ? 1 : 0, item.approvalStatus || 'approved', item.createdAt || now, now],
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
    `INSERT INTO products (id, seller_id, category_id, title, slug, description, price, old_price, currency, colors, sizes, tags, style_tags, occasion_tags, age_range_tags, gender, season_tags, fit_tags, price_segment, cover_url, video_url, gallery_urls, status, in_stock, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), ?)
     ON CONFLICT(id) DO UPDATE SET seller_id=excluded.seller_id, category_id=excluded.category_id, title=excluded.title, slug=excluded.slug, description=excluded.description, price=excluded.price, old_price=excluded.old_price, currency=excluded.currency, colors=excluded.colors, sizes=excluded.sizes, tags=excluded.tags, style_tags=excluded.style_tags, occasion_tags=excluded.occasion_tags, age_range_tags=excluded.age_range_tags, gender=excluded.gender, season_tags=excluded.season_tags, fit_tags=excluded.fit_tags, price_segment=excluded.price_segment, cover_url=excluded.cover_url, video_url=excluded.video_url, gallery_urls=excluded.gallery_urls, status=excluded.status, in_stock=excluded.in_stock, sort_order=excluded.sort_order, updated_at=excluded.updated_at`,
    [item.id, item.sellerId, item.categoryId || '', item.title, item.slug || '', item.description || '', Number(item.price || 0), item.oldPrice ? Number(item.oldPrice) : null, item.currency || 'KZT', json(item.colors), json(item.sizes), json(item.tags), json(item.styleTags), json(item.occasionTags), json(item.ageRangeTags), item.gender || 'women', json(item.seasonTags), json(item.fitTags), item.priceSegment || 'middle', item.coverUrl || '', item.videoUrl || '', json(item.gallery), item.status || 'draft', item.inStock ? 1 : 0, Number(item.sortOrder || 0), item.createdAt || now, now],
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

async function upsertInspirationPost(item: any) {
  const now = stamp()
  await d1Query(
    `INSERT INTO inspiration_posts (id, seller_id, title, caption, content_type, media_type, media_urls, cover_url, style_tags, occasion_tags, age_range_tags, gender, season_tags, is_pinned, pinned_order, publish_to_discovery, moderation_status, status, sort_order, likes_count, saves_count, shares_count, views_count, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), ?)
     ON CONFLICT(id) DO UPDATE SET seller_id=excluded.seller_id, title=excluded.title, caption=excluded.caption, content_type=excluded.content_type, media_type=excluded.media_type, media_urls=excluded.media_urls, cover_url=excluded.cover_url, style_tags=excluded.style_tags, occasion_tags=excluded.occasion_tags, age_range_tags=excluded.age_range_tags, gender=excluded.gender, season_tags=excluded.season_tags, is_pinned=excluded.is_pinned, pinned_order=excluded.pinned_order, publish_to_discovery=excluded.publish_to_discovery, moderation_status=excluded.moderation_status, status=excluded.status, sort_order=excluded.sort_order, likes_count=excluded.likes_count, saves_count=excluded.saves_count, shares_count=excluded.shares_count, views_count=excluded.views_count, updated_at=excluded.updated_at`,
    [item.id, item.sellerId, item.title || '', item.caption || '', item.contentType || 'outfit', item.mediaType || 'image', json(item.mediaUrls), item.coverUrl || item.mediaUrls?.[0] || '', json(item.styleTags), json(item.occasionTags), json(item.ageRangeTags), item.gender || 'women', json(item.seasonTags), item.isPinned ? 1 : 0, Number(item.pinnedOrder || 0), item.publishToDiscovery ? 1 : 0, item.moderationStatus || 'pending', item.status || 'draft', Number(item.sortOrder || 0), Number(item.likesCount || 0), Number(item.savesCount || 0), Number(item.sharesCount || 0), Number(item.viewsCount || 0), item.createdAt || now, now],
  )
  await d1Query('DELETE FROM inspiration_post_products WHERE post_id = ?', [item.id])
  const tagged = Array.isArray(item.taggedProducts) ? item.taggedProducts : []
  for (const [index, taggedProduct] of tagged.entries()) {
    await d1Query('INSERT INTO inspiration_post_products (id, post_id, product_id, x, y, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)', [
      id('tag'),
      item.id,
      taggedProduct.productId,
      taggedProduct.x ?? null,
      taggedProduct.y ?? null,
      taggedProduct.sortOrder ?? index,
      now,
    ])
  }
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

async function createAnalyticsEvent(item: any) {
  await d1Query(
    `INSERT INTO analytics_events (id, user_id, seller_id, product_id, post_id, event_name, source, metadata, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
    [item.id || id('event'), item.userId || '', item.sellerId || '', item.productId || '', item.postId || '', item.eventName, item.source || '', json(item.metadata || {}), item.createdAt || stamp()],
  )
}

async function deleteItem(resource: string, idValue: string) {
  const table: Record<string, string> = {
    sellers: 'sellers',
    categories: 'categories',
    products: 'products',
    feedItems: 'feed_items',
    inspirationPosts: 'inspiration_posts',
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
  if (resource === 'inspirationPosts') return upsertInspirationPost(item)
  if (resource === 'leads') return createLead(item)
  if (resource === 'analyticsEvents') return createAnalyticsEvent(item)
  throw new Error('Unknown resource')
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method === 'GET') return res.status(200).json(await getState())

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
    const isPublicWrite = req.method === 'POST' && (body.resource === 'leads' || body.resource === 'analyticsEvents')
    if (!isPublicWrite && !isAdminRequest(req)) return res.status(401).json({ ok: false, error: 'Unauthorized' })

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
