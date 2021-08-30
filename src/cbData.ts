import { v4 as uuidv4 } from 'uuid'

export interface CbData {
    type: 'download' | 'cancel' | 'refresh'
    data: string
}
const cache = new Map<string, CbData>()

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
