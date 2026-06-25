import type { FeedItem, Product } from '../types'

let runtimeProducts: Product[] = []
let runtimeFeed: FeedItem[] = []

export function setRuntimeData(products: Product[], feed: FeedItem[]) {
  runtimeProducts = products
  runtimeFeed = feed
}

export function getRuntimeProducts() {
  return runtimeProducts
}

export function getRuntimeFeed() {
  return runtimeFeed
}

export function runtimeProductById(id: string) {
  return runtimeProducts.find((product) => product.id === id)
}
