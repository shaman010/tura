import { useState } from 'react'
import { BottomSheet } from './BottomSheet'
import { Icon } from './Icon'
import { Img } from './Img'
import type { Product, Review } from '../types'

interface Props {
  product: Product | undefined
  open: boolean
  onClose: () => void
}

export function ReviewsSheet({ product, open, onClose }: Props) {
  const [text, setText] = useState('')
  const [extra, setExtra] = useState<Review[]>([])
  if (!product) return null
  const all = [...extra, ...product.reviews]

  const submit = () => {
    const t = text.trim()
    if (!t) return
    setExtra((e) => [
      {
        id: 'new' + Date.now(),
        author: 'Вы',
        avatar:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=70&auto=format&fit=crop',
        rating: 5,
        text: t,
        likes: 0,
        date: 'только что',
      },
      ...e,
    ])
    setText('')
  }

  return (
    <BottomSheet open={open} onClose={onClose} heightClass="h-[78%]" label="Отзывы">
      <div className="flex items-center justify-between px-5 pb-3 pt-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold">Отзывы</h3>
          <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-semibold text-muted">
            {all.length}
          </span>
        </div>
        <div className="flex items-center gap-1 text-sm font-bold">
          <Icon name="starFill" size={18} className="text-magenta" />
          <span className="tabular">{product.rating.toFixed(1)}</span>
        </div>
      </div>

      <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto px-5 pb-28">
        {all.map((r) => (
          <div key={r.id} className="flex gap-3">
            <Img
              src={r.avatar}
              alt={r.author}
              fallbackLabel={r.author[0]}
              className="h-9 w-9 flex-shrink-0 rounded-full object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{r.author}</span>
                <span className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Icon
                      key={i}
                      name={i < r.rating ? 'starFill' : 'star'}
                      size={11}
                      className={i < r.rating ? 'text-magenta' : 'text-ink/20'}
                    />
                  ))}
                </span>
              </div>
              <p className="mt-0.5 text-[15px] leading-snug text-ink/90">{r.text}</p>
              {r.photo && (
                <Img
                  src={r.photo}
                  alt="Фото-отзыв"
                  fallbackLabel="фото"
                  className="mt-2 h-28 w-24 rounded-2xl object-cover"
                />
              )}
              <div className="mt-1 flex items-center gap-4 text-xs text-muted">
                <span>{r.date}</span>
                <button className="flex items-center gap-1 hover:text-magenta">
                  <Icon name="heart" size={13} /> {r.likes}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        className="absolute inset-x-0 bottom-0 flex items-center gap-2 border-t border-ink/10 bg-night px-4 pt-3"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 12px)' }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Оставить отзыв…"
          className="h-11 flex-1 rounded-full bg-surface px-4 text-[15px] outline-none focus:ring-2 focus:ring-magenta/40"
        />
        <button
          onClick={submit}
          aria-label="Отправить отзыв"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-magenta text-ink"
        >
          <Icon name="arrowUp" size={20} />
        </button>
      </div>
    </BottomSheet>
  )
}
