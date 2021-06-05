import { v4 as uuidv4 } from 'uuid'

const cache = new Map<string, string>()

export function set(data: string): string {
    const key = uuidv4()
    cache.set(key, data)
    return key
}

export function get(key: string): string | null {
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
