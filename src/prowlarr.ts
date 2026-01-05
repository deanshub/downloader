import { ProwlarrClient } from 'arr-sdk/prowlarr'
import bytes from 'bytes'
import { SearchResults } from './search'

interface ProwlarrSearchResult {
    guid?: string
    title?: string
    size?: number
    seeders?: number
    peers?: number
    downloadUrl?: string
    magnetUrl?: string
    infoHash?: string
    indexer?: string
    protocol?: string
}

/**
 * Extract info hash from a magnet URI
 * Returns null if not a valid magnet link
 */
function extractInfoHash(magnet: string): string | null {
    if (!magnet || !magnet.startsWith('magnet:')) {
        return null
    }
    const match = magnet.match(/urn:btih:([a-zA-Z0-9]{32,40})/i)
    return match ? match[1].toLowerCase() : null
}

/**
 * Convert Prowlarr search result to SearchResults format
 * Uses best-effort approach to fill missing information
 */
function convertProwlarrResult(
    result: ProwlarrSearchResult
): SearchResults | null {
    // Skip results without a title
    if (!result.title) {
        return null
    }

    // Prefer magnetUrl, fall back to downloadUrl
    // Skip .torrent file URLs (we need magnet links)
    let magnet = result.magnetUrl || result.downloadUrl || ''
    if (magnet && !magnet.startsWith('magnet:')) {
        // Skip torrent file URLs
        return null
    }

    // Skip results without a valid magnet link
    if (!magnet) {
        return null
    }

    // Format size using bytes library (best effort)
    let sizeStr = 'Unknown'
    if (result.size && result.size > 0) {
        sizeStr = bytes(result.size)
    }

    // Create description with indexer name if available
    let desc = ''
    if (result.indexer) {
        desc = `[${result.indexer}]`
        if (result.guid) {
            desc += ` ${result.guid}`
        }
    } else if (result.guid) {
        desc = result.guid
    }

    return {
        title: result.title,
        desc,
        size: sizeStr,
        magnet,
        seeders: result.seeders || 0,
    }
}

/**
 * Search Prowlarr for torrents
 * Returns empty array if PROWLARR_BASE_URL or PROWLARR_API_KEY not set
 * Logs errors but fails silently to fall back to other search providers
 */
export async function searchProwlarr(
    term: string,
    limit: number = 40
): Promise<SearchResults[]> {
    // Check if Prowlarr is configured
    const baseUrl = process.env.PROWLARR_BASE_URL
    const apiKey = process.env.PROWLARR_API_KEY

    if (!baseUrl || !apiKey) {
        // Not configured, silently return empty array
        return []
    }

    try {
        const prowlarr = new ProwlarrClient({
            baseUrl,
            apiKey,
        })

        // Search across all indexers
        const results = await prowlarr.search.query({
            query: term,
            type: 'search',
        })

        // Convert results to SearchResults format
        const converted = results
            .map(convertProwlarrResult)
            .filter((r): r is SearchResults => r !== null)

        // Sort by seeders (descending) and limit
        return converted.sort((a, b) => b.seeders - a.seeders).slice(0, limit)
    } catch (error) {
        console.error('Prowlarr search failed:', error)
        return []
    }
}

/**
 * Deduplicate search results by info hash
 * Prefers results with:
 * 1. Valid magnet link
 * 2. Higher seeder count
 * 3. More complete metadata (non-empty desc, valid size)
 */
export function deduplicateResults(results: SearchResults[]): SearchResults[] {
    const hashMap = new Map<string, SearchResults[]>()

    // Group results by info hash
    for (const result of results) {
        const hash = extractInfoHash(result.magnet)
        if (hash) {
            if (!hashMap.has(hash)) {
                hashMap.set(hash, [])
            }
            hashMap.get(hash)!.push(result)
        } else {
            // If we can't extract hash, keep the result as unique
            // Use magnet link itself as key
            hashMap.set(result.magnet, [result])
        }
    }

    // For each group, select the best result
    const deduplicated: SearchResults[] = []
    for (const [hash, group] of hashMap.entries()) {
        if (group.length === 1) {
            deduplicated.push(group[0])
        } else {
            // Sort by quality: seeders, then desc completeness, then size validity
            const best = group.sort((a, b) => {
                // Higher seeders is better
                if (a.seeders !== b.seeders) {
                    return b.seeders - a.seeders
                }
                // Non-empty desc is better
                if (a.desc && !b.desc) return -1
                if (!a.desc && b.desc) return 1
                // Valid size (not "Unknown") is better
                if (a.size !== 'Unknown' && b.size === 'Unknown') return -1
                if (a.size === 'Unknown' && b.size !== 'Unknown') return 1
                return 0
            })[0]
            deduplicated.push(best)
        }
    }

    return deduplicated
}
