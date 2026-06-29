import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../components/Icon'
import { Img } from '../components/Img'
import {
  addMedia,
  type CmsInspirationPost,
  type CmsProduct,
  type CmsSeller,
  makeId,
  slugify,
  upsertInspirationPost,
  upsertProduct,
  upsertSeller,
  useCmsData,
} from '../lib/cms'
import { tenge } from '../lib/format'
import { uploadFileToR2 } from '../lib/mediaUpload'
import { useStore } from '../store/useStore'
import type { AgeRangeTag, FitTag, GenderTag, OccasionTag, ProductStatus, SeasonTag, StyleTag } from '../types'

type StudioTab = 'overview' | 'catalog' | 'inspiration' | 'stock' | 'media' | 'analytics' | 'settings'

const tabs: { id: StudioTab; label: string; icon: Parameters<typeof Icon>[0]['name'] }[] = [
  { id: 'overview', label: 'Обзор', icon: 'home' },
  { id: 'catalog', label: 'Каталог', icon: 'bag' },
  { id: 'inspiration', label: 'Вдохновение', icon: 'sparkles' },
  { id: 'stock', label: 'Наличие', icon: 'bolt' },
  { id: 'media', label: 'Медиа', icon: 'plus' },
  { id: 'analytics', label: 'Аналитика', icon: 'eye' },
  { id: 'settings', label: 'Магазин', icon: 'settings' },
]

const styles: StyleTag[] = ['casual', 'classic', 'office', 'streetwear', 'minimal', 'romantic', 'sport', 'luxury', 'modest', 'korean', 'oversize']
const occasions: OccasionTag[] = ['daily', 'office', 'evening', 'event', 'walk', 'travel', 'vacation', 'holiday']
const ages: AgeRangeTag[] = ['18-24', '25-34', '35-44', '45-54', '55+']
const seasons: SeasonTag[] = ['spring', 'summer', 'autumn', 'winter', 'all-season']
const fits: FitTag[] = ['slim', 'regular', 'loose', 'oversize', 'wide', 'high-waist', 'straight']

export function Studio() {
  const cms = useCmsData()
  const user = useStore((s) => s.user)
  const showToast = useStore((s) => s.showToast)
  const [active, setActive] = useState<StudioTab>('overview')
  const seller = useMemo(() => cms.sellers.find((item) => item.ownerUserId === user.id) ?? cms.sellers[0], [cms.sellers, user.id])
  const products = seller ? cms.products.filter((product) => product.sellerId === seller.id) : []
  const posts = seller ? cms.inspirationPosts.filter((post) => post.sellerId === seller.id) : []
  const events = seller ? cms.analyticsEvents.filter((event) => event.sellerId === seller.id) : []

  const ensureSeller = () => {
    if (seller) return seller
    const created: CmsSeller = {
      id: makeId('seller'),
      ownerUserId: user.id,
      ownerEmail: user.email ?? '',
      name: user.storeName || 'Новый магазин',
      slug: slugify(user.storeName || user.username || 'shop'),
      description: '',
      city: 'Алматы',
      whatsapp: '',
      telegram: '',
      instagram: '',
      logoUrl: user.avatar || '',
      coverUrl: '',
      isActive: true,
      approvalStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    upsertSeller(created)
    showToast('Магазин создан. Заполните WhatsApp в настройках.')
    return created
  }

  return (
    <div className="relative h-[100dvh] w-full max-w-[480px] overflow-hidden bg-base text-ink">
      <header className="border-b border-ink/10 bg-base px-4 pb-3" style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 14px)' }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase text-magenta">Seller Studio</div>
            <h1 className="text-xl font-extrabold">{seller?.name || 'Создайте магазин'}</h1>
          </div>
          <a href="/" className="flex h-10 w-10 items-center justify-center rounded-full bg-surface"><Icon name="home" size={19} /></a>
        </div>
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActive(tab.id)} className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold ${active === tab.id ? 'bg-magenta text-ink' : 'bg-surface text-muted'}`}>
              <Icon name={tab.icon} size={14} /> {tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className="no-scrollbar h-[calc(100%-112px)] overflow-y-auto px-4 py-4">
        {!seller && active !== 'settings' ? (
          <EmptyStudio onCreate={() => { ensureSeller(); setActive('settings') }} />
        ) : (
          <>
            {active === 'overview' && <Overview products={products} posts={posts} events={events} />}
            {active === 'catalog' && <Catalog seller={ensureSeller()} products={products} />}
            {active === 'inspiration' && <Inspiration seller={ensureSeller()} products={products} posts={posts} />}
            {active === 'stock' && <QuickStock products={products} />}
            {active === 'media' && <StudioMedia />}
            {active === 'analytics' && <Analytics events={events} products={products} posts={posts} />}
            {active === 'settings' && <ShopSettings seller={seller} onCreate={ensureSeller} />}
          </>
        )}
      </main>
    </div>
  )
}

function Overview({ products, posts, events }: { products: CmsProduct[]; posts: CmsInspirationPost[]; events: any[] }) {
  const cards = [
    ['Товары', products.length],
    ['Посты', posts.length],
    ['В Discovery', posts.filter((post) => post.publishToDiscovery && post.moderationStatus === 'approved').length],
    ['WhatsApp', events.filter((event) => event.eventName === 'whatsapp_clicked').length],
  ]
  return <div className="space-y-4">
    <div className="grid grid-cols-2 gap-3">{cards.map(([label, value]) => <Stat key={String(label)} label={String(label)} value={String(value)} />)}</div>
    <Panel title="Следующий шаг"><p className="text-sm text-muted">Добавьте товар, затем создайте образ во “Вдохновение” и отметьте товары. Именно эти посты попадают в Discovery.</p></Panel>
    <Panel title="Топ товары"><SimpleRows rows={products.slice(0, 5).map((item) => `${item.title} · ${tenge(item.price)}`)} empty="Товаров пока нет" /></Panel>
  </div>
}

function Catalog({ seller, products }: { seller: CmsSeller; products: CmsProduct[] }) {
  const [editing, setEditing] = useState<Partial<CmsProduct> | null>(null)
  return <div className="space-y-4">
    <button onClick={() => setEditing({ sellerId: seller.id, status: 'draft', inStock: true })} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-magenta font-extrabold"><Icon name="plus" size={18} /> Добавить товар</button>
    {products.length ? products.map((product) => <ProductRow key={product.id} product={product} onEdit={() => setEditing(product)} />) : <Empty text="Каталог пуст. Добавьте первый товар." />}
    {editing && <ProductEditor seller={seller} initial={editing} onClose={() => setEditing(null)} />}
  </div>
}

function ProductEditor({ seller, initial, onClose }: { seller: CmsSeller; initial: Partial<CmsProduct>; onClose: () => void }) {
  const [form, setForm] = useState({
    title: initial.title ?? '',
    price: String(initial.price ?? ''),
    categoryId: initial.categoryId ?? '',
    coverUrl: initial.coverUrl ?? '',
    videoUrl: initial.videoUrl ?? '',
    description: initial.description ?? '',
    sizes: (initial.sizes ?? ['S', 'M']).join(', '),
    colors: (initial.colors ?? [{ name: 'Black', hex: '#111111' }]).map((c) => c.name).join(', '),
    status: initial.status ?? 'draft',
    styleTags: (initial.styleTags ?? ['casual']).join(', '),
    occasionTags: (initial.occasionTags ?? ['daily']).join(', '),
    ageRangeTags: (initial.ageRangeTags ?? ['25-34']).join(', '),
    gender: initial.gender ?? 'women',
    seasonTags: (initial.seasonTags ?? ['all-season']).join(', '),
    fitTags: (initial.fitTags ?? ['regular']).join(', '),
    gallery: (initial.gallery ?? []).join('\n'),
  })
  const [uploading, setUploading] = useState('')
  const set = (k: keyof typeof form, v: string) => setForm((old) => ({ ...old, [k]: v }))
  const upload = async (file: File, field: 'coverUrl' | 'videoUrl' | 'gallery') => {
    setUploading(field)
    try {
      const url = await uploadFileToR2(file)
      addMedia(url, file.type.startsWith('video/') ? 'video' : 'image', file.name)
      if (field === 'gallery') set('gallery', [form.gallery, url].filter(Boolean).join('\n'))
      else set(field, url)
    } finally {
      setUploading('')
    }
  }
  const save = () => {
    const status = form.status === 'published' && !seller.whatsapp ? 'draft' : form.status
    upsertProduct({
      ...initial,
      sellerId: seller.id,
      categoryId: form.categoryId,
      title: form.title,
      slug: initial.slug || slugify(form.title),
      price: Number(form.price || 0),
      description: form.description,
      coverUrl: form.coverUrl,
      videoUrl: form.videoUrl,
      sizes: split(form.sizes),
      colors: split(form.colors).map((name) => ({ name, hex: '#999999' })),
      status: status as ProductStatus,
      inStock: status !== 'out_of_stock',
      styleTags: split(form.styleTags) as StyleTag[],
      occasionTags: split(form.occasionTags) as OccasionTag[],
      ageRangeTags: split(form.ageRangeTags) as AgeRangeTag[],
      gender: form.gender as GenderTag,
      seasonTags: split(form.seasonTags) as SeasonTag[],
      fitTags: split(form.fitTags) as FitTag[],
      gallery: form.gallery.split('\n').map((x) => x.trim()).filter(Boolean),
    })
    onClose()
  }
  return <Modal title="Товар" onClose={onClose}>
    <div className="space-y-3">
      <UploadCard title="Фото товара" url={form.coverUrl} uploading={uploading === 'coverUrl'} accept="image/jpeg,image/png,image/webp" onFile={(file) => upload(file, 'coverUrl')} onClear={() => set('coverUrl', '')} />
      <Field label="Название" value={form.title} onChange={(v) => set('title', v)} />
      <Field label="Цена" value={form.price} onChange={(v) => set('price', v)} type="number" />
      <Field label="Размеры" value={form.sizes} onChange={(v) => set('sizes', v)} />
      <Field label="Цвета" value={form.colors} onChange={(v) => set('colors', v)} />
      <Select label="Статус" value={form.status} onChange={(v) => set('status', v)} options={['draft', 'published', 'hidden', 'out_of_stock', 'archived']} />
      <details className="rounded-3xl bg-ink/[0.04] p-4">
        <summary className="cursor-pointer font-bold">Подробнее</summary>
        <div className="mt-3 space-y-3">
          <TextArea label="Описание" value={form.description} onChange={(v) => set('description', v)} />
          <UploadCard title="Видео" url={form.videoUrl} uploading={uploading === 'videoUrl'} accept="video/mp4,video/quicktime" onFile={(file) => upload(file, 'videoUrl')} onClear={() => set('videoUrl', '')} />
          <Field label="Style tags" value={form.styleTags} onChange={(v) => set('styleTags', v)} hint={styles.join(', ')} />
          <Field label="Occasion tags" value={form.occasionTags} onChange={(v) => set('occasionTags', v)} hint={occasions.join(', ')} />
          <Field label="Age range tags" value={form.ageRangeTags} onChange={(v) => set('ageRangeTags', v)} hint={ages.join(', ')} />
          <Select label="Gender" value={form.gender} onChange={(v) => set('gender', v)} options={['women', 'men', 'unisex']} />
          <Field label="Season tags" value={form.seasonTags} onChange={(v) => set('seasonTags', v)} hint={seasons.join(', ')} />
          <Field label="Fit tags" value={form.fitTags} onChange={(v) => set('fitTags', v)} hint={fits.join(', ')} />
          <TextArea label="Gallery URLs" value={form.gallery} onChange={(v) => set('gallery', v)} />
          <label className="block rounded-2xl bg-surface px-3 py-3 text-sm font-bold">Добавить фото в галерею<input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(e) => Array.from(e.target.files ?? []).forEach((file) => upload(file, 'gallery'))} className="mt-2 block w-full text-xs" /></label>
        </div>
      </details>
      {!seller.whatsapp && <p className="rounded-2xl bg-magenta/10 p-3 text-xs text-magenta">WhatsApp не заполнен. Товар можно сохранить как draft, но для публикации заполните WhatsApp в настройках магазина.</p>}
      <button onClick={save} disabled={!form.title || !form.price || !form.coverUrl} className="h-12 w-full rounded-2xl bg-magenta font-extrabold disabled:opacity-40">Сохранить</button>
    </div>
  </Modal>
}

function Inspiration({ seller, products, posts }: { seller: CmsSeller; products: CmsProduct[]; posts: CmsInspirationPost[] }) {
  const [editing, setEditing] = useState<Partial<CmsInspirationPost> | null>(null)
  return <div className="space-y-4">
    <button onClick={() => setEditing({ sellerId: seller.id, status: 'draft', publishToDiscovery: true })} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-magenta font-extrabold"><Icon name="plus" size={18} /> Добавить образ</button>
    {posts.length ? posts.map((post) => <button key={post.id} onClick={() => setEditing(post)} className="flex w-full gap-3 rounded-3xl bg-ink/[0.04] p-3 text-left"><Img src={post.coverUrl || post.mediaUrls[0]} alt={post.title} fallbackLabel="" className="h-24 w-20 rounded-2xl object-cover" /><div className="min-w-0"><div className="font-bold">{post.title || 'Без названия'}</div><div className="mt-1 line-clamp-2 text-sm text-muted">{post.caption}</div><div className="mt-2 text-xs font-bold text-magenta">{post.taggedProducts.length} товаров · {post.moderationStatus}</div></div></button>) : <Empty text="Пока нет образов. Добавьте первый пост." />}
    {editing && <PostEditor seller={seller} products={products} initial={editing} onClose={() => setEditing(null)} />}
  </div>
}

function PostEditor({ seller, products, initial, onClose }: { seller: CmsSeller; products: CmsProduct[]; initial: Partial<CmsInspirationPost>; onClose: () => void }) {
  const [form, setForm] = useState({
    title: initial.title ?? '',
    caption: initial.caption ?? '',
    mediaUrls: (initial.mediaUrls ?? []).join('\n'),
    taggedProducts: (initial.taggedProducts ?? []).map((item) => item.productId),
    styleTags: (initial.styleTags ?? ['casual']).join(', '),
    occasionTags: (initial.occasionTags ?? ['daily']).join(', '),
    status: initial.status ?? 'draft',
    isPinned: Boolean(initial.isPinned),
    publishToDiscovery: initial.publishToDiscovery ?? true,
  })
  const [uploading, setUploading] = useState(false)
  const firstMedia = form.mediaUrls.split('\n').find(Boolean) ?? ''
  const upload = async (file: File) => {
    setUploading(true)
    try {
      const url = await uploadFileToR2(file)
      addMedia(url, file.type.startsWith('video/') ? 'video' : 'image', file.name)
      setForm((old) => ({ ...old, mediaUrls: [old.mediaUrls, url].filter(Boolean).join('\n') }))
    } finally {
      setUploading(false)
    }
  }
  const save = () => {
    const mediaUrls = form.mediaUrls.split('\n').map((x) => x.trim()).filter(Boolean)
    upsertInspirationPost({
      ...initial,
      sellerId: seller.id,
      title: form.title,
      caption: form.caption,
      mediaUrls,
      coverUrl: firstMedia,
      mediaType: mediaUrls.length > 1 ? 'carousel' : /\.(mp4|mov|webm)$/i.test(firstMedia) ? 'video' : 'image',
      taggedProducts: form.taggedProducts.map((productId, sortOrder) => ({ productId, sortOrder })),
      styleTags: split(form.styleTags) as StyleTag[],
      occasionTags: split(form.occasionTags) as OccasionTag[],
      ageRangeTags: ['25-34'],
      gender: 'women',
      seasonTags: ['all-season'],
      isPinned: form.isPinned,
      publishToDiscovery: form.publishToDiscovery,
      moderationStatus: form.publishToDiscovery ? 'pending' : 'approved',
      status: form.status as any,
    })
    onClose()
  }
  return <Modal title="Образ / пост" onClose={onClose}>
    <div className="space-y-3">
      <UploadCard title="Медиа поста" url={firstMedia} uploading={uploading} accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime" onFile={upload} onClear={() => setForm((old) => ({ ...old, mediaUrls: '' }))} />
      <Field label="Заголовок" value={form.title} onChange={(v) => setForm((old) => ({ ...old, title: v }))} />
      <TextArea label="Подпись" value={form.caption} onChange={(v) => setForm((old) => ({ ...old, caption: v }))} />
      <div className="rounded-3xl bg-ink/[0.04] p-4">
        <div className="mb-2 font-bold">Отметить товары</div>
        <div className="grid gap-2">
          {products.map((product) => (
            <label key={product.id} className="flex items-center gap-3 rounded-2xl bg-surface p-2 text-sm">
              <input type="checkbox" checked={form.taggedProducts.includes(product.id)} onChange={(e) => setForm((old) => ({ ...old, taggedProducts: e.target.checked ? [...old.taggedProducts, product.id] : old.taggedProducts.filter((id) => id !== product.id) }))} />
              <Img src={product.coverUrl} alt={product.title} fallbackLabel="" className="h-10 w-10 rounded-xl object-cover" />
              <span className="font-bold">{product.title}</span>
            </label>
          ))}
        </div>
      </div>
      <Field label="Style tags" value={form.styleTags} onChange={(v) => setForm((old) => ({ ...old, styleTags: v }))} />
      <Field label="Occasion tags" value={form.occasionTags} onChange={(v) => setForm((old) => ({ ...old, occasionTags: v }))} />
      <Select label="Статус" value={form.status} onChange={(v) => setForm((old) => ({ ...old, status: v as any }))} options={['draft', 'published', 'hidden', 'archived']} />
      <Toggle label="Закрепить сверху" value={form.isPinned} onChange={(v) => setForm((old) => ({ ...old, isPinned: v }))} />
      <Toggle label="Отправить в Discovery" value={form.publishToDiscovery} onChange={(v) => setForm((old) => ({ ...old, publishToDiscovery: v }))} />
      <button onClick={save} disabled={!firstMedia} className="h-12 w-full rounded-2xl bg-magenta font-extrabold disabled:opacity-40">Опубликовать</button>
    </div>
  </Modal>
}

function QuickStock({ products }: { products: CmsProduct[] }) {
  return <div className="space-y-3">{products.map((product) => <div key={product.id} className="grid grid-cols-[56px_1fr_88px] items-center gap-3 rounded-3xl bg-ink/[0.04] p-3"><Img src={product.coverUrl} alt={product.title} fallbackLabel="" className="h-14 w-14 rounded-2xl object-cover" /><div><div className="font-bold">{product.title}</div><input defaultValue={product.price} type="number" onBlur={(e) => upsertProduct({ ...product, price: Number(e.target.value) })} className="mt-1 h-9 w-28 rounded-xl bg-surface px-2 text-sm" /></div><button onClick={() => upsertProduct({ ...product, status: product.status === 'published' ? 'hidden' : 'published' })} className="rounded-2xl bg-surface px-2 py-2 text-xs font-bold">{product.status === 'published' ? 'Скрыть' : 'Вкл.'}</button></div>)}</div>
}

function StudioMedia() {
  const cms = useCmsData()
  const [uploading, setUploading] = useState(false)
  const upload = async (file: File) => {
    setUploading(true)
    try {
      const url = await uploadFileToR2(file)
      addMedia(url, file.type.startsWith('video/') ? 'video' : 'image', file.name)
    } finally {
      setUploading(false)
    }
  }
  return <div className="space-y-4"><label className="flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-ink/20 bg-surface p-5 text-center"><Icon name="plus" className="text-magenta" /><span className="mt-2 font-extrabold">{uploading ? 'Загружаем...' : 'Загрузить медиа'}</span><input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime" onChange={(e) => { const file = e.target.files?.[0]; if (file) void upload(file) }} className="hidden" /></label><div className="grid grid-cols-2 gap-3">{cms.media.map((media) => <div key={media.id} className="overflow-hidden rounded-3xl bg-ink/[0.04]">{media.type === 'video' ? <video src={media.url} className="h-36 w-full object-cover" controls /> : <Img src={media.url} alt={media.name} fallbackLabel="" className="h-36 w-full object-cover" />}<button onClick={() => navigator.clipboard?.writeText(media.url)} className="w-full px-3 py-2 text-xs font-bold text-magenta">Copy URL</button></div>)}</div></div>
}

function Analytics({ events }: { events: any[]; products: CmsProduct[]; posts: CmsInspirationPost[] }) {
  return <div className="grid grid-cols-2 gap-3"><Stat label="Просмотры" value={String(events.filter((e) => e.eventName.includes('view')).length)} /><Stat label="Сохранения" value={String(events.filter((e) => e.eventName.includes('saved')).length)} /><Stat label="WhatsApp" value={String(events.filter((e) => e.eventName === 'whatsapp_clicked').length)} /><Stat label="Подписки" value={String(events.filter((e) => e.eventName === 'follow_created').length)} /></div>
}

function ShopSettings({ seller, onCreate }: { seller?: CmsSeller; onCreate: () => CmsSeller }) {
  const [form, setForm] = useState<CmsSeller | null>(seller ?? null)
  useEffect(() => {
    setForm(seller ?? null)
  }, [seller])
  if (!form) return <EmptyStudio onCreate={() => setForm(onCreate())} />
  const set = (k: keyof CmsSeller, v: string | boolean) => setForm((old) => (old ? { ...old, [k]: v } : old))
  return <div className="space-y-3">
    <Field label="Название магазина" value={form.name} onChange={(v) => set('name', v)} />
    <Field label="Slug" value={form.slug} onChange={(v) => set('slug', v)} />
    <Field label="Город" value={form.city} onChange={(v) => set('city', v)} />
    <Field label="WhatsApp" value={form.whatsapp} onChange={(v) => set('whatsapp', v)} hint="Например: 77001234567" />
    <Field label="Instagram" value={form.instagram} onChange={(v) => set('instagram', v)} />
    <TextArea label="Описание" value={form.description} onChange={(v) => set('description', v)} />
    <button onClick={() => upsertSeller(form)} className="h-12 w-full rounded-2xl bg-magenta font-extrabold">Сохранить магазин</button>
  </div>
}

function EmptyStudio({ onCreate }: { onCreate: () => void }) {
  return <div className="flex min-h-[65vh] flex-col items-center justify-center text-center"><Icon name="store" size={42} className="text-magenta" /><h2 className="mt-3 text-xl font-extrabold">Создайте витрину</h2><p className="mt-2 text-sm text-muted">Магазин, каталог и вдохновение будут доступны по публичной ссылке.</p><button onClick={onCreate} className="mt-5 rounded-2xl bg-magenta px-5 py-3 font-bold">Создать магазин</button></div>
}

function ProductRow({ product, onEdit }: { product: CmsProduct; onEdit: () => void }) {
  return <button onClick={onEdit} className="flex w-full gap-3 rounded-3xl bg-ink/[0.04] p-3 text-left"><Img src={product.coverUrl} alt={product.title} fallbackLabel="" className="h-20 w-16 rounded-2xl object-cover" /><div className="min-w-0 flex-1"><div className="truncate font-bold">{product.title}</div><div className="mt-1 text-sm font-extrabold">{tenge(product.price)}</div><div className="mt-1 text-xs text-muted">{product.status} · {product.sizes.join(', ')}</div></div><Icon name="chevronRight" className="self-center text-muted" /></button>
}

function UploadCard({ title, url, accept, uploading, onFile, onClear }: { title: string; url: string; accept: string; uploading: boolean; onFile: (file: File) => void; onClear: () => void }) {
  const video = /\.(mp4|mov|webm)(\?|$)/i.test(url)
  return <div className="rounded-3xl bg-ink/[0.04] p-3"><div className="mb-2 font-bold">{title}</div>{url ? <div className="overflow-hidden rounded-2xl">{video ? <video src={url} className="h-48 w-full object-cover" controls /> : <Img src={url} alt={title} fallbackLabel="" className="h-48 w-full object-cover" />}</div> : <label className="flex h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-ink/20 bg-surface text-center"><Icon name="plus" className="text-magenta" /><span className="mt-2 font-bold">Выбрать файл</span><input type="file" accept={accept} onChange={(e) => { const file = e.target.files?.[0]; if (file) onFile(file) }} className="hidden" /></label>}<div className="mt-2 grid grid-cols-2 gap-2"><label className="rounded-2xl bg-surface px-3 py-2 text-center text-xs font-bold">Загрузить<input type="file" accept={accept} onChange={(e) => { const file = e.target.files?.[0]; if (file) onFile(file) }} className="hidden" /></label><button onClick={onClear} className="rounded-2xl bg-surface px-3 py-2 text-xs font-bold">Очистить</button></div>{uploading && <div className="mt-2 text-xs font-bold text-magenta">Загружаем в Cloudflare...</div>}</div>
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-[220] flex justify-center bg-black/70 p-4"><div className="no-scrollbar mt-8 max-h-[88dvh] w-full max-w-[480px] overflow-y-auto rounded-[28px] bg-[#121216] p-5 shadow-2xl"><div className="mb-4 flex items-center justify-between"><h3 className="text-xl font-extrabold">{title}</h3><button onClick={onClose} className="rounded-full bg-surface p-2"><Icon name="close" /></button></div>{children}</div></div>
}

function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-3xl bg-ink/[0.04] p-4"><div className="text-2xl font-extrabold">{value}</div><div className="text-xs font-bold text-muted">{label}</div></div> }
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-3xl bg-ink/[0.04] p-4"><h3 className="mb-2 font-bold">{title}</h3>{children}</section> }
function Empty({ text }: { text: string }) { return <div className="rounded-3xl border border-dashed border-ink/15 p-8 text-center text-muted">{text}</div> }
function SimpleRows({ rows, empty }: { rows: string[]; empty: string }) { return rows.length ? <div className="space-y-2">{rows.map((row) => <div key={row} className="rounded-2xl bg-surface px-3 py-2 text-sm">{row}</div>)}</div> : <p className="text-sm text-muted">{empty}</p> }
function Field({ label, value, onChange, type = 'text', hint }: { label: string; value: string; onChange: (v: string) => void; type?: string; hint?: string }) { return <label className="block"><span className="mb-1 block text-xs font-bold text-muted">{label}</span><input value={value} type={type} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-2xl bg-surface px-3 outline-none focus:ring-2 focus:ring-magenta/40" />{hint && <span className="mt-1 block text-[11px] text-muted">{hint}</span>}</label> }
function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) { return <label className="block"><span className="mb-1 block text-xs font-bold text-muted">{label}</span><textarea value={value} onChange={(e) => onChange(e.target.value)} className="min-h-[90px] w-full rounded-2xl bg-surface px-3 py-2 outline-none focus:ring-2 focus:ring-magenta/40" /></label> }
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) { return <label className="block"><span className="mb-1 block text-xs font-bold text-muted">{label}</span><select value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-2xl bg-surface px-3 outline-none">{options.map((item) => <option key={item}>{item}</option>)}</select></label> }
function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) { return <label className="flex items-center gap-2 text-sm font-bold"><input checked={value} type="checkbox" onChange={(e) => onChange(e.target.checked)} /> {label}</label> }
const split = (value: string) => value.split(',').map((x) => x.trim()).filter(Boolean)
