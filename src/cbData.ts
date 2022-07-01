import { v4 as uuidv4 } from 'uuid'
import LRU from 'lru-cache'

const lruOptions = {
    max: 500,
    ttl: 1000 * 60 * 60,
}

export interface CbData {
    type: 'download' | 'cancel' | 'refresh'
    data: string
}
const cache = new LRU<string, CbData>(lruOptions)

export function set(cbdata: CbData): string {
    const key = uuidv4()
    cache.set(key, cbdata)
    return key
}

export function get(key: string): CbData | null {
    if (cache.has(key)) {
        return cache.get(key) ?? null
    }
    return null
}

function clearCache() {
    for (const [key] of cache) {
        if (cache.size > 50) {
            cache.delete(key)
        }
    }
}

setInterval(clearCache, 60 * 1000)
