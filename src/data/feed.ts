import type { FeedItem } from '../types'
import { getRuntimeFeed } from '../lib/runtimeData'

export const FEED: FeedItem[] = []
export const getFeed = () => getRuntimeFeed()
