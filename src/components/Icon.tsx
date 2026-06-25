import type { SVGProps } from 'react'

export type IconName =
  | 'spark'
  | 'search'
  | 'bag'
  | 'user'
  | 'heart'
  | 'heartFill'
  | 'close'
  | 'plus'
  | 'minus'
  | 'share'
  | 'send'
  | 'comment'
  | 'star'
  | 'starFill'
  | 'chevronLeft'
  | 'chevronRight'
  | 'chevronDown'
  | 'check'
  | 'trash'
  | 'sliders'
  | 'bolt'
  | 'eye'
  | 'eyeOff'
  | 'ruler'
  | 'pin'
  | 'settings'
  | 'box'
  | 'arrowUp'
  | 'sparkles'
  | 'bookmark'
  | 'bookmarkFill'
  | 'home'
  | 'store'
  | 'volume'
  | 'volumeOff'
  | 'mail'
  | 'phone'
  | 'google'
  | 'apple'

const P: Record<IconName, JSX.Element> = {
  spark: (
    <path d="M12 3l2.2 5.6L20 11l-5.8 2.4L12 19l-2.2-5.6L4 11l5.8-2.4L12 3z" />
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </>
  ),
  bag: (
    <>
      <path d="M6 8h12l-1 12H7L6 8z" />
      <path d="M9 8a3 3 0 0 1 6 0" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  heart: <path d="M12 20s-7-4.4-9.5-9A4.8 4.8 0 0 1 12 6a4.8 4.8 0 0 1 9.5 5c-2.5 4.6-9.5 9-9.5 9z" />,
  heartFill: (
    <path
      d="M12 20s-7-4.4-9.5-9A4.8 4.8 0 0 1 12 6a4.8 4.8 0 0 1 9.5 5c-2.5 4.6-9.5 9-9.5 9z"
      fill="currentColor"
    />
  ),
  close: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  minus: <path d="M5 12h14" />,
  share: (
    <>
      <path d="M12 16V4" />
      <path d="M8 8l4-4 4 4" />
      <path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
    </>
  ),
  send: (
    <>
      <path d="M21 3L10 14" />
      <path d="M21 3l-7 18-4-7-7-4 18-7z" />
    </>
  ),
  comment: <path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.3A8 8 0 1 1 21 12z" />,
  star: <path d="M12 4l2.3 4.7 5.2.8-3.8 3.7.9 5.2L12 16l-4.6 2.4.9-5.2L4.5 9.5l5.2-.8L12 4z" />,
  starFill: (
    <path
      d="M12 4l2.3 4.7 5.2.8-3.8 3.7.9 5.2L12 16l-4.6 2.4.9-5.2L4.5 9.5l5.2-.8L12 4z"
      fill="currentColor"
    />
  ),
  chevronLeft: <path d="M15 6l-6 6 6 6" />,
  chevronRight: <path d="M9 6l6 6-6 6" />,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  check: <path d="M5 12l5 5L20 7" />,
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M9 7V5h6v2" />
      <path d="M6 7l1 13h10l1-13" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 7h10" />
      <circle cx="17" cy="7" r="2.2" />
      <path d="M20 17H10" />
      <circle cx="7" cy="17" r="2.2" />
    </>
  ),
  bolt: <path d="M13 3L5 14h6l-1 7 8-11h-6l1-7z" fill="currentColor" stroke="none" />,
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a3 3 0 0 0 4.2 4.2" />
      <path d="M9.4 5.2A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.3 4.1M6.1 6.1A17 17 0 0 0 2 12s3.5 7 10 7a10 10 0 0 0 3-.5" />
    </>
  ),
  ruler: (
    <>
      <rect x="3" y="8" width="18" height="8" rx="1.5" />
      <path d="M7 8v3M11 8v4M15 8v3M19 8v4" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4 12H1M23 12h-3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
    </>
  ),
  box: (
    <>
      <path d="M3 8l9-5 9 5v8l-9 5-9-5V8z" />
      <path d="M3 8l9 5 9-5M12 13v8" />
    </>
  ),
  arrowUp: (
    <>
      <path d="M12 19V5" />
      <path d="M6 11l6-6 6 6" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 3l1.6 4L18 8.6 13.6 10 12 14l-1.6-4L6 8.6 10.4 7 12 3z" />
      <path d="M19 14l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z" />
    </>
  ),
  bookmark: <path d="M6 4h12v16l-6-4-6 4V4z" />,
  bookmarkFill: <path d="M6 4h12v16l-6-4-6 4V4z" fill="currentColor" />,
  home: (
    <>
      <path d="M4 11l8-7 8 7" />
      <path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" />
      <path d="M10 20v-6h4v6" />
    </>
  ),
  store: (
    <>
      <path d="M4 9l1-4h14l1 4" />
      <path d="M4 9a2.2 2.2 0 0 0 4 0 2.2 2.2 0 0 0 4 0 2.2 2.2 0 0 0 4 0 2.2 2.2 0 0 0 4 0" />
      <path d="M5 11v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8" />
    </>
  ),
  volume: (
    <>
      <path d="M5 9v6h4l5 4V5L9 9H5z" />
      <path d="M17 8a5 5 0 0 1 0 8" />
      <path d="M19.5 5.5a8 8 0 0 1 0 13" />
    </>
  ),
  volumeOff: (
    <>
      <path d="M5 9v6h4l5 4V5L9 9H5z" />
      <path d="M22 9l-5 6M17 9l5 6" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M4 7.5l8 5.5 8-5.5" />
    </>
  ),
  phone: (
    <path d="M6.5 3.5h3l1.5 4.5-2 1.2a10.5 10.5 0 0 0 5 5l1.2-2 4.5 1.5v3a2 2 0 0 1-2 2A16.5 16.5 0 0 1 4.5 5.5a2 2 0 0 1 2-2z" />
  ),
  google: (
    <>
      <path d="M21 12.2A9 9 0 1 1 18.4 6" />
      <path d="M21.5 12h-7.5" />
    </>
  ),
  apple: (
    <>
      <path
        d="M16.3 12.6c0-2 1.6-3 1.7-3a3.7 3.7 0 0 0-2.9-1.6c-1.2-.1-2.4.7-3 .7s-1.6-.7-2.6-.7A3.9 3.9 0 0 0 4 10.9c-1.4 2.5-.4 6.2 1 8.2.7 1 1.5 2.1 2.6 2 1-.1 1.4-.7 2.7-.7s1.6.7 2.7.6c1.1 0 1.8-1 2.5-2a8.9 8.9 0 0 0 1.1-2.3s-2.3-.9-2.3-3.1z"
        fill="currentColor"
        stroke="none"
      />
      <path d="M14.5 6.3A3.4 3.4 0 0 0 15.3 4a3.6 3.6 0 0 0-2.3 1.2 3.2 3.2 0 0 0-.8 2.2 3 3 0 0 0 2.3-1.1z" fill="currentColor" stroke="none" />
    </>
  ),
}

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName
  size?: number
}

export function Icon({ name, size = 24, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {P[name]}
    </svg>
  )
}
