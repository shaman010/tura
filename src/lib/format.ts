export function tenge(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value) + ' ₸'
}

export function compact(value: number): string {
  if (value >= 1000) return (value / 1000).toFixed(value % 1000 === 0 ? 0 : 1) + 'k'
  return String(value)
}
