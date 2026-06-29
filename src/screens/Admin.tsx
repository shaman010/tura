import { useMemo, useState } from 'react'
import { Icon } from '../components/Icon'
import {
  addMedia,
  clearCmsState,
  createCmsLead,
  type AdminSection,
  type CmsCategory,
  type CmsInspirationPost,
  type CmsProduct,
  type CmsSeller,
  removeCmsItem,
  slugify,
  updateLeadStatus,
  upsertCategory,
  upsertInspirationPost,
  upsertProduct,
  upsertSeller,
  useCmsData,
} from '../lib/cms'
import { tenge } from '../lib/format'

const SESSION_KEY = 'swipd-admin-session'
const TOKEN_KEY = 'swipd-admin-token'
const tabs: { id: AdminSection; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'products', label: 'Товары' },
  { id: 'feed', label: 'Вдохновение' },
  { id: 'sellers', label: 'Продавцы' },
  { id: 'categories', label: 'Категории' },
  { id: 'leads', label: 'Заявки' },
  { id: 'media', label: 'Медиа' },
  { id: 'settings', label: 'Настройки' },
]

async function uploadFileToR2(file: File) {
  try {
    const ticketRes = await fetch('/api/admin/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY) || ''}` },
      body: JSON.stringify({ fileName: file.name, contentType: file.type, size: file.size }),
    })
    const ticket = await ticketRes.json()
    if (ticketRes.ok && ticket.uploadUrl && ticket.publicUrl) {
      const uploadRes = await fetch(ticket.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!uploadRes.ok) throw new Error('Direct R2 upload failed')
      return String(ticket.publicUrl)
    }
  } catch {
    // Fall back to server upload for small files if R2 CORS is not configured yet.
  }

  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY) || ''}` },
    body: JSON.stringify({ fileName: file.name, contentType: file.type, base64 }),
  })
  const data = await res.json()
  if (!res.ok || !data.url) throw new Error(data.error || 'Upload failed')
  return String(data.url)
}

export function Admin() {
  const [authed, setAuthed] = useState(() => localStorage.getItem(SESSION_KEY) === 'ok')
  const [active, setActive] = useState<AdminSection>('dashboard')
  const cms = useCmsData()
  const [toast, setToast] = useState('')

  const notify = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 1800)
  }

  if (!authed) return <AdminLogin onDone={() => setAuthed(true)} />

  return (
    <div className="min-h-[100dvh] bg-base text-ink">
      <div className="mx-auto flex min-h-[100dvh] max-w-7xl">
        <aside className="hidden w-64 shrink-0 border-r border-ink/10 bg-ink/[0.03] p-4 md:block">
          <div className="mb-6 flex items-center gap-2 text-xl font-extrabold">
            <Icon name="store" size={22} className="text-magenta" /> Swipd Admin
          </div>
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActive(tab.id)}
                className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-bold transition ${
                  active === tab.id ? 'bg-magenta text-ink shadow-glow' : 'text-muted hover:bg-ink/[0.06] hover:text-ink'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <button
            onClick={() => {
              localStorage.removeItem(SESSION_KEY)
              localStorage.removeItem(TOKEN_KEY)
              setAuthed(false)
            }}
            className="mt-6 w-full rounded-2xl border border-ink/15 px-4 py-3 text-sm font-bold"
          >
            Выйти
          </button>
        </aside>

        <main className="min-w-0 flex-1 p-4 md:p-6">
          <div className="mb-4 flex gap-2 overflow-x-auto md:hidden">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActive(tab.id)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${active === tab.id ? 'bg-magenta' : 'bg-surface'}`}>
                {tab.label}
              </button>
            ))}
          </div>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold">{tabs.find((tab) => tab.id === active)?.label}</h1>
              <p className="text-sm text-muted">Управляемый MVP: localStorage сегодня, D1/R2 через API завтра.</p>
            </div>
            <a href="/" className="rounded-2xl bg-surface px-4 py-2 text-sm font-bold">На сайт</a>
          </div>

          {active === 'dashboard' && <Dashboard />}
          {active === 'sellers' && <Sellers notify={notify} />}
          {active === 'categories' && <Categories notify={notify} />}
          {active === 'products' && <Products notify={notify} />}
          {active === 'feed' && <InspirationItems notify={notify} />}
          {active === 'leads' && <Leads notify={notify} />}
          {active === 'media' && <Media notify={notify} />}
          {active === 'settings' && <Settings notify={notify} />}
        </main>
      </div>
      {toast && <div className="fixed bottom-5 left-1/2 z-[200] -translate-x-1/2 rounded-full bg-magenta px-5 py-3 text-sm font-bold shadow-glow">{toast}</div>}
    </div>
  )
}

function AdminLogin({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const login = async () => {
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) throw new Error('Неверный пароль')
      const data = await res.json()
      localStorage.setItem(SESSION_KEY, 'ok')
      if (data.token) localStorage.setItem(TOKEN_KEY, data.token)
      onDone()
    } catch {
      setError('Не удалось войти. Проверьте ADMIN_PASSWORD на Vercel.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-base px-5 text-ink">
      <div className="w-full max-w-sm rounded-[28px] border border-ink/10 bg-ink/[0.04] p-6">
        <div className="mb-5 flex items-center gap-2 text-2xl font-extrabold">
          <Icon name="store" className="text-magenta" /> Admin
        </div>
        <Field label="Пароль" value={password} onChange={setPassword} type="password" placeholder="ADMIN_PASSWORD" />
        {error && <p className="mt-3 text-sm text-magenta">{error}</p>}
        <button onClick={login} disabled={!password || busy} className="mt-5 h-12 w-full rounded-2xl bg-magenta font-bold disabled:opacity-40">
          {busy ? 'Проверяем...' : 'Войти'}
        </button>
      </div>
    </div>
  )
}

function Dashboard() {
  const cms = useCmsData()
  const activeProducts = cms.products.filter((p) => p.status === 'published' && p.inStock)
  const stats = [
    ['Товары', cms.products.length],
    ['Активные товары', activeProducts.length],
    ['Продавцы', cms.sellers.length],
    ['Образы', cms.inspirationPosts.length],
    ['Заявки', cms.leads.length],
    ['Категории', cms.categories.length],
  ]
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {stats.map(([label, value]) => <Card key={label} title={String(label)} value={String(value)} />)}
      </div>
      {cms.products.length === 0 && <Empty text="Начните с добавления продавца, категории и товара." />}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Последние заявки">
          <SimpleList rows={cms.leads.slice(0, 5).map((lead) => `${lead.customerName} · ${lead.customerPhone} · ${lead.status}`)} empty="Заявок пока нет" />
        </Panel>
        <Panel title="Последние товары">
          <SimpleList rows={cms.products.slice(0, 5).map((product) => `${product.title} · ${product.status} · ${tenge(product.price)}`)} empty="Товаров пока нет" />
        </Panel>
      </div>
    </div>
  )
}

function Sellers({ notify }: { notify: (msg: string) => void }) {
  const cms = useCmsData()
  const [editing, setEditing] = useState<Partial<CmsSeller> | null>(null)
  return (
    <CrudLayout title="Продавцы" action="Создать продавца" onAdd={() => setEditing({ isActive: true })}>
      <Table headers={['Название', 'Slug', 'Город', 'Статус', 'Действия']}>
        {cms.sellers.map((seller) => (
          <tr key={seller.id}>
            <Td>{seller.name}</Td><Td>{seller.slug}</Td><Td>{seller.city}</Td><Td>{seller.isActive ? 'active' : 'inactive'}</Td>
            <Td><RowActions onEdit={() => setEditing(seller)} onDelete={() => { removeCmsItem('sellers', seller.id); notify('Продавец удалён') }} link={`/seller/${seller.slug}`} /></Td>
          </tr>
        ))}
      </Table>
      {editing && <SellerForm initial={editing} onClose={() => setEditing(null)} onSaved={() => { notify('Продавец сохранён'); setEditing(null) }} />}
    </CrudLayout>
  )
}

function SellerForm({ initial, onClose, onSaved }: { initial: Partial<CmsSeller>; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: initial.name ?? '', slug: initial.slug ?? '', city: initial.city ?? '', description: initial.description ?? '', whatsapp: initial.whatsapp ?? '', telegram: initial.telegram ?? '', instagram: initial.instagram ?? '', logoUrl: initial.logoUrl ?? '', coverUrl: initial.coverUrl ?? '', isActive: initial.isActive ?? true })
  const [uploading, setUploading] = useState('')
  const set = (k: keyof typeof form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }))
  const uploadInto = async (file: File, field: 'logoUrl' | 'coverUrl') => {
    setUploading(field)
    try {
      const uploadedUrl = await uploadFileToR2(file)
      addMedia(uploadedUrl, 'image', file.name)
      set(field, uploadedUrl)
    } finally {
      setUploading('')
    }
  }
  return <Modal title="Продавец" onClose={onClose}><div className="grid gap-3 md:grid-cols-2">
    <Field label="Название" value={form.name} onChange={(v) => set('name', v)} />
    <Field label="Slug" value={form.slug} onChange={(v) => set('slug', v)} placeholder={slugify(form.name)} />
    <Field label="Город" value={form.city} onChange={(v) => set('city', v)} />
    <Field label="WhatsApp" value={form.whatsapp} onChange={(v) => set('whatsapp', v)} />
    <Field label="Telegram" value={form.telegram} onChange={(v) => set('telegram', v)} />
    <Field label="Instagram" value={form.instagram} onChange={(v) => set('instagram', v)} />
    <UploadField label="Логотип магазина" value={form.logoUrl} accept="image/jpeg,image/png,image/webp" uploading={uploading === 'logoUrl'} onUrlChange={(v) => set('logoUrl', v)} onFile={(file) => uploadInto(file, 'logoUrl')} />
    <UploadField label="Обложка магазина" value={form.coverUrl} accept="image/jpeg,image/png,image/webp" uploading={uploading === 'coverUrl'} onUrlChange={(v) => set('coverUrl', v)} onFile={(file) => uploadInto(file, 'coverUrl')} />
    <TextArea label="Описание" value={form.description} onChange={(v) => set('description', v)} />
    <Toggle label="Active" value={form.isActive} onChange={(v) => set('isActive', v)} />
  </div><SaveButton disabled={!form.name} onClick={() => { upsertSeller({ ...initial, ...form, slug: form.slug || slugify(form.name) }); onSaved() }} /></Modal>
}

function Categories({ notify }: { notify: (msg: string) => void }) {
  const cms = useCmsData()
  const [editing, setEditing] = useState<Partial<CmsCategory> | null>(null)
  return <CrudLayout title="Категории" action="Создать категорию" onAdd={() => setEditing({ isActive: true })}>
    <Table headers={['Название', 'Slug', 'Порядок', 'Статус', 'Действия']}>{cms.categories.map((category) => <tr key={category.id}><Td>{category.name}</Td><Td>{category.slug}</Td><Td>{category.sortOrder}</Td><Td>{category.isActive ? 'active' : 'inactive'}</Td><Td><RowActions onEdit={() => setEditing(category)} onDelete={() => { removeCmsItem('categories', category.id); notify('Категория удалена') }} /></Td></tr>)}</Table>
    {editing && <CategoryForm initial={editing} onClose={() => setEditing(null)} onSaved={() => { notify('Категория сохранена'); setEditing(null) }} />}
  </CrudLayout>
}

function CategoryForm({ initial, onClose, onSaved }: { initial: Partial<CmsCategory>; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: initial.name ?? '', slug: initial.slug ?? '', parentId: initial.parentId ?? '', sortOrder: String(initial.sortOrder ?? 0), isActive: initial.isActive ?? true })
  const set = (k: keyof typeof form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }))
  return <Modal title="Категория" onClose={onClose}><div className="grid gap-3 md:grid-cols-2">
    <Field label="Название" value={form.name} onChange={(v) => set('name', v)} />
    <Field label="Slug" value={form.slug} onChange={(v) => set('slug', v)} />
    <Field label="Parent category ID" value={form.parentId} onChange={(v) => set('parentId', v)} />
    <Field label="Sort order" value={form.sortOrder} onChange={(v) => set('sortOrder', v)} type="number" />
    <Toggle label="Active" value={form.isActive} onChange={(v) => set('isActive', v)} />
  </div><SaveButton disabled={!form.name} onClick={() => { upsertCategory({ ...initial, ...form, sortOrder: Number(form.sortOrder), slug: form.slug || slugify(form.name) }); onSaved() }} /></Modal>
}

function Products({ notify }: { notify: (msg: string) => void }) {
  const cms = useCmsData()
  const [editing, setEditing] = useState<Partial<CmsProduct> | null>(null)
  const [q, setQ] = useState('')
  const list = cms.products.filter((product) => product.title.toLowerCase().includes(q.toLowerCase()))
  return <CrudLayout title="Товары" action="Создать товар" onAdd={() => setEditing({ status: 'draft', inStock: true })}>
    <div className="mb-3"><Field label="Поиск" value={q} onChange={setQ} placeholder="Название товара" /></div>
    <Table headers={['Название', 'Продавец', 'Категория', 'Цена', 'Статус', 'Действия']}>{list.map((product) => <tr key={product.id}><Td>{product.title}</Td><Td>{cms.sellers.find((s) => s.id === product.sellerId)?.name ?? '-'}</Td><Td>{cms.categories.find((c) => c.id === product.categoryId)?.name ?? '-'}</Td><Td>{tenge(product.price)}</Td><Td>{product.status}</Td><Td><RowActions onEdit={() => setEditing(product)} onDelete={() => { removeCmsItem('products', product.id); notify('Товар удалён') }} link={`/product/${product.id}`} /></Td></tr>)}</Table>
    {editing && <ProductForm initial={editing} onClose={() => setEditing(null)} onSaved={() => { notify('Товар сохранён'); setEditing(null) }} />}
  </CrudLayout>
}

function ProductForm({ initial, onClose, onSaved }: { initial: Partial<CmsProduct>; onClose: () => void; onSaved: () => void }) {
  const cms = useCmsData()
  const [uploading, setUploading] = useState('')
  const [form, setForm] = useState({
    title: initial.title ?? '', slug: initial.slug ?? '', sellerId: initial.sellerId ?? '', categoryId: initial.categoryId ?? '',
    description: initial.description ?? '', price: String(initial.price ?? ''), oldPrice: String(initial.oldPrice ?? ''),
    colors: (initial.colors ?? [{ name: 'Black', hex: '#111111' }]).map((c) => `${c.name}:${c.hex}`).join(', '),
    sizes: (initial.sizes ?? ['XS-S', 'M-L']).join(', '), tags: (initial.tags ?? []).join(', '), styleTags: (initial.styleTags ?? ['casual']).join(', '),
    coverUrl: initial.coverUrl ?? '', videoUrl: initial.videoUrl ?? '', gallery: (initial.gallery ?? []).join('\n'), status: initial.status ?? 'draft',
    inStock: initial.inStock ?? true, sortOrder: String(initial.sortOrder ?? 0),
  })
  const set = (k: keyof typeof form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }))
  const uploadInto = async (file: File, field: 'coverUrl' | 'videoUrl' | 'gallery') => {
    setUploading(field)
    try {
      const uploadedUrl = await uploadFileToR2(file)
      addMedia(uploadedUrl, file.type.startsWith('video/') ? 'video' : 'image', file.name)
      if (field === 'gallery') set('gallery', [form.gallery, uploadedUrl].filter(Boolean).join('\n'))
      else set(field, uploadedUrl)
    } finally {
      setUploading('')
    }
  }
  const colors = form.colors.split(',').map((x) => x.trim()).filter(Boolean).map((x) => { const [name, hex] = x.split(':'); return { name: name || 'Color', hex: hex || '#999999' } })
  return <Modal title="Товар" onClose={onClose} wide><div className="grid gap-3 md:grid-cols-2">
    <Field label="Название" value={form.title} onChange={(v) => set('title', v)} />
    <Field label="Slug" value={form.slug} onChange={(v) => set('slug', v)} />
    <Select label="Продавец" value={form.sellerId} onChange={(v) => set('sellerId', v)} options={cms.sellers.map((s) => [s.id, s.name])} />
    <Select label="Категория" value={form.categoryId} onChange={(v) => set('categoryId', v)} options={cms.categories.map((c) => [c.id, c.name])} />
    <Field label="Цена" value={form.price} onChange={(v) => set('price', v)} type="number" />
    <Field label="Старая цена" value={form.oldPrice} onChange={(v) => set('oldPrice', v)} type="number" />
    <Field label="Цвета name:#hex" value={form.colors} onChange={(v) => set('colors', v)} />
    <Field label="Размеры через запятую" value={form.sizes} onChange={(v) => set('sizes', v)} />
    <Field label="Теги" value={form.tags} onChange={(v) => set('tags', v)} />
    <Field label="Style tags" value={form.styleTags} onChange={(v) => set('styleTags', v)} />
    <UploadField label="Обложка товара" value={form.coverUrl} accept="image/jpeg,image/png,image/webp" uploading={uploading === 'coverUrl'} onUrlChange={(v) => set('coverUrl', v)} onFile={(file) => uploadInto(file, 'coverUrl')} />
    <UploadField label="Видео товара" value={form.videoUrl} accept="video/mp4,video/quicktime" uploading={uploading === 'videoUrl'} onUrlChange={(v) => set('videoUrl', v)} onFile={(file) => uploadInto(file, 'videoUrl')} />
    <TextArea label="Описание" value={form.description} onChange={(v) => set('description', v)} />
    <GalleryUploader value={form.gallery} uploading={uploading === 'gallery'} onChange={(v) => set('gallery', v)} onFile={(file) => uploadInto(file, 'gallery')} />
    <Select label="Статус" value={form.status} onChange={(v) => set('status', v)} options={[['draft','draft'],['published','published'],['archived','archived']]} />
    <Field label="Sort order" value={form.sortOrder} onChange={(v) => set('sortOrder', v)} type="number" />
    <Toggle label="В наличии" value={form.inStock} onChange={(v) => set('inStock', v)} />
  </div><SaveButton disabled={!form.title || !form.sellerId || !form.categoryId || !form.price || !form.coverUrl} onClick={() => { upsertProduct({ ...initial, ...form, price: Number(form.price), oldPrice: form.oldPrice ? Number(form.oldPrice) : undefined, colors, sizes: split(form.sizes), tags: split(form.tags), styleTags: split(form.styleTags) as CmsProduct['styleTags'], gallery: form.gallery.split('\n').map((x) => x.trim()).filter(Boolean), sortOrder: Number(form.sortOrder), status: form.status as CmsProduct['status'] }); onSaved() }} /></Modal>
}

function InspirationItems({ notify }: { notify: (msg: string) => void }) {
  const cms = useCmsData()
  const [editing, setEditing] = useState<Partial<CmsInspirationPost> | null>(null)
  return <CrudLayout title="Вдохновение" action="Создать образ" onAdd={() => setEditing({ status: 'draft', publishToDiscovery: true, moderationStatus: 'pending' })}>
    <Table headers={['Образ', 'Продавец', 'Товары', 'Discovery', 'Статус', 'Действия']}>{cms.inspirationPosts.map((item) => <tr key={item.id}><Td>{item.title || item.caption || 'Без названия'}</Td><Td>{cms.sellers.find((s) => s.id === item.sellerId)?.name ?? '-'}</Td><Td>{item.taggedProducts.length}</Td><Td>{item.publishToDiscovery ? item.moderationStatus : 'нет'}</Td><Td>{item.status}</Td><Td><RowActions onEdit={() => setEditing(item)} onDelete={() => { removeCmsItem('inspirationPosts', item.id); notify('Образ удалён') }} link={`/post/${item.id}`} /></Td></tr>)}</Table>
    {editing && <InspirationForm initial={editing} onClose={() => setEditing(null)} onSaved={() => { notify('Образ сохранён'); setEditing(null) }} />}
  </CrudLayout>
}

function InspirationForm({ initial, onClose, onSaved }: { initial: Partial<CmsInspirationPost>; onClose: () => void; onSaved: () => void }) {
  const cms = useCmsData()
  const [form, setForm] = useState({
    sellerId: initial.sellerId ?? '',
    title: initial.title ?? '',
    caption: initial.caption ?? '',
    mediaUrls: (initial.mediaUrls ?? []).join('\n'),
    taggedProducts: (initial.taggedProducts ?? []).map((item) => item.productId),
    styleTags: (initial.styleTags ?? ['casual']).join(', '),
    occasionTags: (initial.occasionTags ?? ['daily']).join(', '),
    contentType: initial.contentType ?? 'outfit',
    status: initial.status ?? 'draft',
    moderationStatus: initial.moderationStatus ?? 'pending',
    isPinned: initial.isPinned ?? false,
    publishToDiscovery: initial.publishToDiscovery ?? true,
    sortOrder: String(initial.sortOrder ?? 0),
  })
  const [uploading, setUploading] = useState('')
  const set = (k: keyof typeof form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }))
  const uploadMedia = async (file: File) => {
    setUploading('media')
    try {
      const uploadedUrl = await uploadFileToR2(file)
      addMedia(uploadedUrl, file.type.startsWith('video/') ? 'video' : 'image', file.name)
      set('mediaUrls', [form.mediaUrls, uploadedUrl].filter(Boolean).join('\n'))
    } finally {
      setUploading('')
    }
  }
  const urls = form.mediaUrls.split('\n').map((x) => x.trim()).filter(Boolean)
  const firstMedia = urls[0] ?? ''
  const sellerProducts = cms.products.filter((product) => product.sellerId === form.sellerId)
  return <Modal title="Образ / пост" onClose={onClose} wide><div className="grid gap-3 md:grid-cols-2">
    <Select label="Продавец" value={form.sellerId} onChange={(v) => set('sellerId', v)} options={cms.sellers.map((s) => [s.id, s.name])} />
    <Select label="Тип контента" value={form.contentType} onChange={(v) => set('contentType', v)} options={[['outfit','образ'],['try_on_video','видео примерки'],['lookbook','лукбук'],['size_tip','размеры'],['fabric_story','ткань'],['announcement','объявление'],['sale','акция'],['new_collection','новая коллекция'],['behind_scenes','закулисье']]} />
    <UploadField label="Главное медиа" value={firstMedia} accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime" uploading={uploading === 'media'} onUrlChange={(v) => set('mediaUrls', [v, ...urls.slice(1)].filter(Boolean).join('\n'))} onFile={uploadMedia} />
    <GalleryUploader value={form.mediaUrls} uploading={uploading === 'media'} onChange={(v) => set('mediaUrls', v)} onFile={uploadMedia} />
    <Field label="Заголовок" value={form.title} onChange={(v) => set('title', v)} />
    <TextArea label="Подпись" value={form.caption} onChange={(v) => set('caption', v)} />
    <Field label="Style tags" value={form.styleTags} onChange={(v) => set('styleTags', v)} />
    <Field label="Occasion tags" value={form.occasionTags} onChange={(v) => set('occasionTags', v)} />
    <div className="md:col-span-2 rounded-3xl border border-ink/10 bg-ink/[0.04] p-4">
      <div className="mb-3 text-sm font-extrabold">В этом образе</div>
      {sellerProducts.length ? <div className="grid gap-2 md:grid-cols-2">{sellerProducts.map((product) => (
        <label key={product.id} className="flex items-center gap-3 rounded-2xl bg-surface p-3 text-sm">
          <input type="checkbox" checked={form.taggedProducts.includes(product.id)} onChange={(e) => setForm((old) => ({ ...old, taggedProducts: e.target.checked ? [...old.taggedProducts, product.id] : old.taggedProducts.filter((id) => id !== product.id) }))} />
          <span className="font-bold">{product.title}</span>
        </label>
      ))}</div> : <p className="text-sm text-muted">Сначала выберите продавца и добавьте ему товары.</p>}
    </div>
    <Select label="Статус" value={form.status} onChange={(v) => set('status', v)} options={[['draft','draft'],['published','published'],['hidden','hidden'],['archived','archived']]} />
    <Select label="Модерация Discovery" value={form.moderationStatus} onChange={(v) => set('moderationStatus', v)} options={[['pending','pending'],['approved','approved'],['rejected','rejected'],['hidden','hidden']]} />
    <Field label="Sort order" value={form.sortOrder} onChange={(v) => set('sortOrder', v)} type="number" />
    <Toggle label="Закрепить сверху" value={form.isPinned} onChange={(v) => set('isPinned', v)} />
    <Toggle label="Публиковать в Discovery" value={form.publishToDiscovery} onChange={(v) => set('publishToDiscovery', v)} />
  </div><SaveButton disabled={!form.sellerId || !firstMedia} onClick={() => {
    upsertInspirationPost({
      ...initial,
      sellerId: form.sellerId,
      title: form.title,
      caption: form.caption,
      contentType: form.contentType as CmsInspirationPost['contentType'],
      mediaType: urls.length > 1 ? 'carousel' : /\.(mp4|mov|webm)(\?|$)/i.test(firstMedia) ? 'video' : 'image',
      mediaUrls: urls,
      coverUrl: firstMedia,
      taggedProducts: form.taggedProducts.map((productId, sortOrder) => ({ productId, sortOrder })),
      styleTags: split(form.styleTags) as CmsInspirationPost['styleTags'],
      occasionTags: split(form.occasionTags) as CmsInspirationPost['occasionTags'],
      ageRangeTags: initial.ageRangeTags ?? ['25-34'],
      gender: initial.gender ?? 'women',
      seasonTags: initial.seasonTags ?? ['all-season'],
      isPinned: form.isPinned,
      publishToDiscovery: form.publishToDiscovery,
      moderationStatus: form.moderationStatus as CmsInspirationPost['moderationStatus'],
      status: form.status as CmsInspirationPost['status'],
      sortOrder: Number(form.sortOrder),
    })
    onSaved()
  }} /></Modal>
}

function Leads({ notify }: { notify: (msg: string) => void }) {
  const cms = useCmsData()
  return <CrudLayout title="Заявки" action="Тестовая заявка" onAdd={() => { createCmsLead({ productId: cms.products[0]?.id ?? '', sellerId: cms.sellers[0]?.id ?? '', customerName: 'Test Client', customerPhone: '+7 700 000 00 00', city: 'Алматы', selectedSize: 'M-L', selectedColor: 'Black', comment: 'Тестовая заявка', source: 'admin' }); notify('Тестовая заявка создана') }}>
    <Table headers={['Дата', 'Клиент', 'Телефон', 'Город', 'Товар', 'Продавец', 'Размер', 'Цвет', 'Источник', 'Статус']}>{cms.leads.map((lead) => <tr key={lead.id}><Td>{new Date(lead.createdAt).toLocaleString('ru-RU')}</Td><Td>{lead.customerName}</Td><Td>{lead.customerPhone}</Td><Td>{lead.city}</Td><Td>{cms.products.find((p) => p.id === lead.productId)?.title ?? '-'}</Td><Td>{cms.sellers.find((s) => s.id === lead.sellerId)?.name ?? '-'}</Td><Td>{lead.selectedSize}</Td><Td>{lead.selectedColor}</Td><Td>{lead.source}</Td><Td><select value={lead.status} onChange={(e) => updateLeadStatus(lead.id, e.target.value as any)} className="rounded-xl bg-surface px-2 py-1">{['new','sent_to_seller','in_progress','closed','cancelled'].map((s) => <option key={s}>{s}</option>)}</select></Td></tr>)}</Table>
  </CrudLayout>
}

function Media({ notify }: { notify: (msg: string) => void }) {
  const cms = useCmsData()
  const [url, setUrl] = useState('')
  const [type, setType] = useState<'image' | 'video'>('image')
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [manual, setManual] = useState(false)
  const upload = async (file: File) => {
    setUploading(true)
    try {
      const uploadedUrl = await uploadFileToR2(file)
      addMedia(uploadedUrl, file.type.startsWith('video/') ? 'video' : 'image', file.name)
      await navigator.clipboard?.writeText(uploadedUrl)
      setFile(null)
      notify('Файл загружен, URL скопирован')
    } catch {
      notify('Не удалось загрузить файл. Проверьте R2 ключи в Vercel.')
    } finally {
      setUploading(false)
    }
  }
  return <div className="space-y-4">
    <Panel title="Загрузить фото или видео">
      <div className="rounded-3xl border border-dashed border-ink/20 bg-surface p-5">
        <div className="grid gap-4 md:grid-cols-[1fr_220px]">
          <label className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-3xl bg-ink/[0.04] px-4 text-center">
            <Icon name="plus" size={26} className="mb-2 text-magenta" />
            <span className="font-extrabold">{file ? file.name : 'Выберите файл с компьютера'}</span>
            <span className="mt-1 text-xs text-muted">jpg, png, webp, mp4, mov до 100MB</span>
            <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="hidden" />
          </label>
          <button onClick={() => file && void upload(file)} disabled={!file || uploading} className="rounded-3xl bg-magenta px-5 py-4 font-extrabold disabled:opacity-40">
            {uploading ? 'Загружаем в Cloudflare...' : 'Загрузить в Cloudflare'}
          </button>
        </div>
        <p className="mt-3 text-xs text-muted">После загрузки ссылка автоматически появится в медиатеке и скопируется.</p>
      </div>
      <button onClick={() => setManual((v) => !v)} className="mt-4 text-sm font-bold text-magenta">{manual ? 'Скрыть ручную ссылку' : 'Вставить ссылку вручную'}</button>
      {manual && <div className="mt-3 grid gap-3 md:grid-cols-[1fr_160px_140px]"><Field label="URL из R2/CDN" value={url} onChange={setUrl} /><Select label="Type" value={type} onChange={(v) => setType(v as any)} options={[['image','image'],['video','video']]} /><button onClick={() => { addMedia(url, type); setUrl(''); notify('Media URL добавлен') }} disabled={!url} className="mt-6 rounded-2xl bg-magenta font-bold disabled:opacity-40">Добавить</button></div>}
    </Panel>
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{cms.media.map((m) => <MediaTile key={m.id} url={m.url} type={m.type} name={m.name} />)}</div>
  </div>
}

function Settings({ notify }: { notify: (msg: string) => void }) {
  return <Panel title="Настройки"><div className="space-y-3 text-sm text-muted"><p>Cloudflare D1/R2 подключаются через Worker API. Секреты не должны попадать во frontend.</p><button onClick={() => { if (confirm('Очистить весь CMS-контент?')) { clearCmsState(); notify('CMS очищен') } }} className="rounded-2xl bg-magenta px-4 py-3 font-bold text-ink">Очистить local CMS</button></div></Panel>
}

function CrudLayout({ title, action, onAdd, children }: { title: string; action: string; onAdd: () => void; children: React.ReactNode }) {
  return <div className="space-y-4"><div className="flex items-center justify-between"><h2 className="text-lg font-extrabold">{title}</h2><button onClick={onAdd} className="rounded-2xl bg-magenta px-4 py-2 text-sm font-bold">{action}</button></div>{children}</div>
}

function Card({ title, value }: { title: string; value: string }) { return <div className="rounded-3xl bg-ink/[0.04] p-4"><div className="text-2xl font-extrabold">{value}</div><div className="text-xs font-semibold text-muted">{title}</div></div> }
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-3xl border border-ink/10 bg-ink/[0.04] p-4"><h3 className="mb-3 font-bold">{title}</h3>{children}</section> }
function Empty({ text }: { text: string }) { return <div className="rounded-3xl border border-dashed border-ink/15 p-8 text-center text-muted">{text}</div> }
function SimpleList({ rows, empty }: { rows: string[]; empty: string }) { return rows.length ? <div className="space-y-2">{rows.map((r) => <div key={r} className="rounded-2xl bg-surface px-3 py-2 text-sm">{r}</div>)}</div> : <p className="text-sm text-muted">{empty}</p> }
function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) { return <div className="overflow-x-auto rounded-3xl border border-ink/10"><table className="min-w-full text-sm"><thead className="bg-ink/[0.06] text-left text-xs uppercase text-muted"><tr>{headers.map((h) => <th key={h} className="px-3 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-ink/10">{children}</tbody></table></div> }
function Td({ children }: { children: React.ReactNode }) { return <td className="max-w-[260px] truncate px-3 py-3">{children}</td> }
function RowActions({ onEdit, onDelete, link }: { onEdit: () => void; onDelete: () => void; link?: string }) { return <div className="flex gap-2"><button onClick={onEdit} className="rounded-xl bg-surface px-3 py-1 font-bold">Edit</button>{link && <a href={link} className="rounded-xl bg-surface px-3 py-1 font-bold">Open</a>}<button onClick={() => confirm('Удалить?') && onDelete()} className="rounded-xl bg-magenta/15 px-3 py-1 font-bold text-magenta">Delete</button></div> }
function Modal({ title, children, onClose, wide }: { title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) { return <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/70 p-4"><div className={`max-h-[90dvh] w-full overflow-y-auto rounded-[28px] bg-[#121216] p-5 shadow-2xl ${wide ? 'max-w-4xl' : 'max-w-2xl'}`}><div className="mb-4 flex items-center justify-between"><h3 className="text-xl font-extrabold">{title}</h3><button onClick={onClose} className="rounded-full bg-surface p-2"><Icon name="close" /></button></div>{children}</div></div> }
function Field({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) { return <label className="block"><span className="mb-1 block text-xs font-bold text-muted">{label}</span><input value={value} type={type} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-11 w-full rounded-2xl bg-surface px-3 outline-none focus:ring-2 focus:ring-magenta/40" /></label> }
function UploadField({ label, value, accept, uploading, onUrlChange, onFile }: { label: string; value: string; accept: string; uploading: boolean; onUrlChange: (v: string) => void; onFile: (file: File) => void }) {
  const [manual, setManual] = useState(false)
  const isVideo = /\.(mp4|mov|webm)(\?|$)/i.test(value)
  return <div className="rounded-3xl border border-ink/10 bg-ink/[0.04] p-4">
    <div className="mb-3 flex items-center justify-between gap-3">
      <span className="text-sm font-extrabold">{label}</span>
      {value && <button onClick={() => navigator.clipboard?.writeText(value)} className="rounded-full bg-surface px-3 py-1 text-xs font-bold text-magenta">Copy URL</button>}
    </div>
    {value ? <div className="mb-3 overflow-hidden rounded-2xl bg-black/30">{isVideo ? <video src={value} controls className="h-44 w-full object-cover" /> : <img src={value} alt={label} className="h-44 w-full object-cover" />}</div> : <label className="mb-3 flex h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-ink/20 bg-surface text-center">
      <Icon name="plus" size={24} className="mb-2 text-magenta" />
      <span className="font-bold">Выбрать файл</span>
      <span className="mt-1 text-xs text-muted">загрузится в Cloudflare R2</span>
      <input type="file" accept={accept} onChange={(e) => { const file = e.target.files?.[0]; if (file) onFile(file) }} className="hidden" />
    </label>}
    <div className="grid gap-2 sm:grid-cols-2">
      <label className="block">
        <span className="sr-only">Загрузить файл</span>
        <input type="file" accept={accept} onChange={(e) => { const file = e.target.files?.[0]; if (file) onFile(file) }} className="w-full rounded-2xl bg-surface px-3 py-2 text-sm" />
      </label>
      <button onClick={() => onUrlChange('')} disabled={!value || uploading} className="rounded-2xl bg-surface px-3 py-2 text-sm font-bold disabled:opacity-40">Очистить</button>
    </div>
    {uploading && <span className="mt-2 block text-xs font-bold text-magenta">Загружаем файл в Cloudflare...</span>}
    <button onClick={() => setManual((v) => !v)} className="mt-3 text-xs font-bold text-muted hover:text-magenta">{manual ? 'Скрыть ручной URL' : 'Вставить URL вручную'}</button>
    {manual && <div className="mt-2"><Field label={`${label} URL`} value={value} onChange={onUrlChange} /></div>}
  </div>
}

function GalleryUploader({ value, uploading, onChange, onFile }: { value: string; uploading: boolean; onChange: (v: string) => void; onFile: (file: File) => void }) {
  const urls = value.split('\n').map((x) => x.trim()).filter(Boolean)
  const remove = (url: string) => onChange(urls.filter((item) => item !== url).join('\n'))
  return <div className="md:col-span-2 rounded-3xl border border-ink/10 bg-ink/[0.04] p-4">
    <div className="mb-3 flex items-center justify-between">
      <span className="text-sm font-extrabold">Галерея фото</span>
      <label className="cursor-pointer rounded-2xl bg-magenta px-4 py-2 text-sm font-bold">
        Добавить фото
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => { Array.from(e.target.files ?? []).forEach((file) => onFile(file)) }} className="hidden" />
      </label>
    </div>
    {uploading && <p className="mb-3 text-xs font-bold text-magenta">Загружаем фото в Cloudflare...</p>}
    {urls.length ? <div className="grid gap-3 sm:grid-cols-3">{urls.map((url) => <div key={url} className="overflow-hidden rounded-2xl bg-surface"><img src={url} alt="" className="h-36 w-full object-cover" /><button onClick={() => remove(url)} className="w-full px-3 py-2 text-xs font-bold text-magenta">Удалить</button></div>)}</div> : <div className="rounded-2xl border border-dashed border-ink/20 p-8 text-center text-sm text-muted">Фото пока нет. Нажмите “Добавить фото”.</div>}
    <details className="mt-3">
      <summary className="cursor-pointer text-xs font-bold text-muted">Ручной список URL</summary>
      <TextArea label="URL, по одному на строку" value={value} onChange={onChange} />
    </details>
  </div>
}

function MediaTile({ url, type, name }: { url: string; type: 'image' | 'video'; name: string }) {
  return <div className="overflow-hidden rounded-3xl border border-ink/10 bg-ink/[0.04]">
    {type === 'video' ? <video src={url} controls className="h-48 w-full bg-black object-cover" /> : <img src={url} alt={name} className="h-48 w-full object-cover" />}
    <div className="space-y-2 p-3">
      <div className="truncate text-sm font-bold">{name}</div>
      <button onClick={() => navigator.clipboard?.writeText(url)} className="w-full rounded-2xl bg-surface px-3 py-2 text-sm font-bold text-magenta">Скопировать URL</button>
    </div>
  </div>
}
function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) { return <label className="block md:col-span-2"><span className="mb-1 block text-xs font-bold text-muted">{label}</span><textarea value={value} onChange={(e) => onChange(e.target.value)} className="min-h-[100px] w-full rounded-2xl bg-surface px-3 py-2 outline-none focus:ring-2 focus:ring-magenta/40" /></label> }
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[][] }) { return <label className="block"><span className="mb-1 block text-xs font-bold text-muted">{label}</span><select value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-2xl bg-surface px-3 outline-none">{!value && <option value="">Выберите</option>}{options.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label> }
function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) { return <label className="mt-6 flex items-center gap-2 text-sm font-bold"><input checked={value} type="checkbox" onChange={(e) => onChange(e.target.checked)} /> {label}</label> }
function SaveButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) { return <button onClick={onClick} disabled={disabled} className="mt-5 h-12 w-full rounded-2xl bg-magenta font-bold disabled:opacity-40">Сохранить</button> }
const split = (value: string) => value.split(',').map((x) => x.trim()).filter(Boolean)
