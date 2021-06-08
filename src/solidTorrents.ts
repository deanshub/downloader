import axios from 'axios'
import querystring from 'querystring'
import url, { URLSearchParams } from 'url'

interface SolidResults {
    magnet: string
    size: number
    tags: string[]
    rating: Record<string, number>
    swarm: {
        seeders: number
        leechers: number
        downloads: number
        verified: boolean
        audit: number
    }
    _id: string
    category: string
    removed: boolean
    infoHash: string
    title: string
    imported: string
    lastmod: string
}

export async function searchSolid(term: string): Promise<SolidResults[]> {
    try {
        const q = term.replace(/ /g, '+')
        const qs = new URLSearchParams({ q, category: 'all', sort: 'seeders' })
        const fullUrl = `https://solidtorrents.net/api/v1/search?${qs.toString()}`
        const response = await axios.get<{ results: SolidResults[] }>(fullUrl)
        return response.data.results
    } catch (e) {
        console.warn("Can't find solid torrents")
        console.warn(e)
        return []
    }
}
