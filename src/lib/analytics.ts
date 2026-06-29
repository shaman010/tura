// Простая система событий: лог в localStorage + console.
// Готова к замене на Amplitude/Mixpanel/GA — достаточно поменять реализацию track().

export type AnalyticsEvent =
  | 'page_view'
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'onboarding_skipped'
  | 'seller_page_opened'
  | 'seller_page_viewed'
  | 'catalog_opened'
  | 'inspiration_opened'
  | 'post_viewed'
  | 'post_saved'
  | 'follow_clicked'
  | 'follow_created'
  | 'discovery_post_viewed'
  | 'tagged_product_clicked'
  | 'style_tag_interaction'
  | 'discovery_opened'
  | 'feed_item_viewed'
  | 'feed_swiped'
  | 'feed_view'
  | 'swipe_up'
  | 'swipe_down'
  | 'swipe_right'
  | 'swipe_left'
  | 'product_opened'
  | 'price_revealed'
  | 'product_saved'
  | 'favorite_added'
  | 'add_to_cart'
  | 'buy_now_clicked'
  | 'lead_form_opened'
  | 'lead_submitted'
  | 'whatsapp_clicked'
  | 'seller_link_clicked'
  | 'search_opened'
  | 'search_card_opened'
  | 'search_query'
  | 'category_selected'
  | 'price_toggle_changed'
  | 'search_card_tapped'
  | 'cart_select_mode_enabled'
  | 'cart_item_selected'
  | 'checkout_started'
  | 'order_completed'

const KEY = 'swipd-analytics'
const MAX = 500

export interface AnalyticsEntry {
  event: AnalyticsEvent
  props?: Record<string, unknown>
  ts: number
}

export function track(event: AnalyticsEvent, props?: Record<string, unknown>) {
  const entry: AnalyticsEntry = { event, props, ts: Date.now() }
  try {
    const raw = localStorage.getItem(KEY)
    const arr: AnalyticsEntry[] = raw ? JSON.parse(raw) : []
    arr.push(entry)
    localStorage.setItem(KEY, JSON.stringify(arr.slice(-MAX)))
  } catch {
    /* localStorage недоступен — не критично */
  }
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug('%c[analytics]', 'color:#EA6A2A;font-weight:600', event, props ?? '')
  }
}

export const trackEvent = track

export function getAnalytics(): AnalyticsEntry[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function clearAnalytics() {
  localStorage.removeItem(KEY)
}
