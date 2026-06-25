import { useState } from 'react'

const GRADIENTS = [
  'linear-gradient(135deg,#FF2D7A,#D91D62)',
  'linear-gradient(135deg,#2A1620,#0E0E10)',
  'linear-gradient(135deg,#3A1226,#14141A)',
  'linear-gradient(135deg,#1C1C20,#0A0A0C)',
  'linear-gradient(135deg,#B83280,#2A1A24)',
]

function hash(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

interface ImgProps {
  src: string
  alt: string
  className?: string
  fallbackLabel?: string
  draggable?: boolean
}

/**
 * Изображение с мягким gradient-fallback: если фото не загрузилось
 * (офлайн / битый url), показываем брендовый градиент и подпись —
 * никаких сломанных картинок в ленте.
 */
export function Img({ src, alt, className, fallbackLabel, draggable = false }: ImgProps) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const grad = GRADIENTS[hash(src) % GRADIENTS.length]
  const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(src)

  // для видео-источников показываем первый кадр как статичное превью
  if (isVideo && !failed) {
    return (
      <video
        src={src}
        muted
        playsInline
        preload="metadata"
        onLoadedData={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`${className ?? ''} ${loaded ? '' : 'animate-pulse'}`}
        style={loaded ? undefined : { background: grad }}
      />
    )
  }

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center text-ink/90 ${className ?? ''}`}
        style={{ backgroundImage: grad }}
        role="img"
        aria-label={alt}
      >
        {fallbackLabel && (
          <span className="px-4 text-center text-sm font-semibold tracking-wide">
            {fallbackLabel}
          </span>
        )}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      draggable={draggable}
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      className={`${className ?? ''} ${loaded ? '' : 'animate-pulse'}`}
      style={loaded ? undefined : { background: grad }}
    />
  )
}
