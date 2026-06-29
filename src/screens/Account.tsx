import { Icon } from '../components/Icon'
import { Img } from '../components/Img'
import { SizeFinder } from '../components/SizeFinder'
import { BottomSheet } from '../components/BottomSheet'
import { useStore } from '../store/useStore'
import { productById } from '../data/products'
import { useRuntimeCatalog } from '../lib/cms'
import { preferencePercents } from '../lib/recommendations'
import { useState } from 'react'

export function Account() {
  const user = useStore((s) => s.user)
  const openSettings = useStore((s) => s.openSettings)
  const openAuth = useStore((s) => s.openAuth)
  const openProduct = useStore((s) => s.openProduct)
  const { inspirationPosts, sellers } = useRuntimeCatalog()
  const [sizesOpen, setSizesOpen] = useState(false)
  const savedProducts = user.savedProducts.map(productById).filter(Boolean)
  const savedPosts = inspirationPosts.filter((post) => user.savedPosts.includes(post.id))
  const followed = sellers.filter((seller) => user.followedSellerIds.includes(seller.id))

  return (
    <div className="relative flex h-full w-full max-w-[480px] flex-col bg-base text-ink">
      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-28">
        <div className="flex items-center justify-between pb-1" style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 16px)' }}>
          <h1 className="px-1 text-2xl font-extrabold">Профиль</h1>
          <button onClick={openSettings} className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 bg-ink/[0.05]"><Icon name="settings" size={19} /></button>
        </div>

        <section className="mt-3 rounded-[28px] border border-ink/10 bg-ink/[0.04] p-5">
          <div className="flex items-center gap-4">
            <Img src={user.avatar} alt={user.name} fallbackLabel={user.name[0]} className="h-[68px] w-[68px] rounded-full border border-ink/10 object-cover" />
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-xl font-extrabold leading-tight">{user.name}</h2>
              <p className="truncate text-sm text-muted">{user.username}</p>
            </div>
          </div>
          <button onClick={() => user.role === 'seller' ? (window.location.href = '/studio') : openAuth()} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-magenta font-extrabold">
            <Icon name="store" size={18} /> {user.role === 'seller' ? 'Перейти в Studio' : 'У вас магазин одежды? Создать витрину'}
          </button>
        </section>

        <Section icon="sparkles" title="Мой стиль">
          <div className="space-y-3">
            {preferencePercents(user.stylePreferences).slice(0, 5).map((item) => <div key={item.tag}><div className="mb-1 flex justify-between text-sm font-semibold"><span>{item.label}</span><span className="text-muted">{item.percent}%</span></div><div className="h-2.5 overflow-hidden rounded-full bg-ink/[0.06]"><div className="h-full rounded-full bg-magenta" style={{ width: `${item.percent}%` }} /></div></div>)}
          </div>
        </Section>

        <Section icon="bookmark" title="Избранное">
          <h3 className="mb-2 text-sm font-bold">Сохраненные образы</h3>
          {savedPosts.length ? <div className="mb-4 grid grid-cols-2 gap-2">{savedPosts.slice(0, 4).map((post) => <button key={post.id} onClick={() => (window.location.href = `/post/${post.id}`)} className="relative overflow-hidden rounded-2xl"><Img src={post.coverUrl || post.mediaUrls[0]} alt={post.title || ''} fallbackLabel="" className="h-40 w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" /><span className="absolute bottom-2 left-2 right-2 truncate text-xs font-bold text-white">{post.title || post.sellerName}</span></button>)}</div> : <EmptyLine text="Сохраненных образов пока нет" />}
          <h3 className="mb-2 text-sm font-bold">Сохраненные товары</h3>
          {savedProducts.length ? <div className="grid grid-cols-3 gap-2">{savedProducts.slice(0, 6).map((product) => product && <button key={product.id} onClick={() => openProduct(product.id)} className="overflow-hidden rounded-2xl"><Img src={product.images[0]} alt={product.title} fallbackLabel="" className="h-32 w-full object-cover" /></button>)}</div> : <EmptyLine text="Сохраненных товаров пока нет" />}
        </Section>

        <Section icon="store" title="Подписки">
          {followed.length ? <div className="space-y-2">{followed.map((seller) => <button key={seller.id} onClick={() => (window.location.href = `/seller/${seller.slug}`)} className="flex w-full items-center gap-3 rounded-2xl bg-surface p-3 text-left"><Img src={seller.logoUrl} alt={seller.name} fallbackLabel={seller.name[0]} className="h-12 w-12 rounded-2xl object-cover" /><div><div className="font-bold">{seller.name}</div><div className="text-xs text-muted">{seller.city}</div></div></button>)}</div> : <EmptyLine text="Вы пока не подписаны на продавцов" />}
        </Section>

        <Section icon="ruler" title="Мои размеры">
          <button onClick={() => setSizesOpen(true)} className="h-12 w-full rounded-2xl bg-surface font-bold">Заполнить / изменить размеры</button>
        </Section>

        <Section icon="eye" title="История">
          <div className="grid grid-cols-2 gap-3">
            <MiniStat label="Недавно смотрел" value={String(user.recentProductIds.length + user.recentPostIds.length)} />
            <MiniStat label="WhatsApp-клики" value={String(user.whatsappClicks.length)} />
          </div>
        </Section>

        <Section icon="settings" title="Настройки">
          <button onClick={openSettings} className="h-12 w-full rounded-2xl bg-surface font-bold">Открыть настройки</button>
        </Section>
      </div>

      <BottomSheet open={sizesOpen} onClose={() => setSizesOpen(false)} label="Мои размеры">
        <div className="px-5 pb-8 pt-2"><h3 className="mb-4 text-lg font-bold">Мои размеры</h3><SizeFinder onDone={() => setSizesOpen(false)} /></div>
      </BottomSheet>
    </div>
  )
}

function Section({ icon, title, children }: { icon: Parameters<typeof Icon>[0]['name']; title: string; children: React.ReactNode }) {
  return <section className="mt-3 rounded-[28px] border border-ink/10 bg-ink/[0.04] p-5"><div className="mb-4 flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink/[0.06]"><Icon name={icon} size={18} /></span><h3 className="text-[15px] font-bold">{title}</h3></div>{children}</section>
}
function EmptyLine({ text }: { text: string }) { return <div className="rounded-2xl border border-dashed border-ink/15 p-4 text-center text-sm text-muted">{text}</div> }
function MiniStat({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-surface p-4 text-center"><div className="text-2xl font-extrabold">{value}</div><div className="text-xs text-muted">{label}</div></div> }
