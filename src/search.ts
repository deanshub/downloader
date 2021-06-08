import TorrentSearchApi from 'torrent-search-api'
import { searchSolid } from './solidTorrents'
import bytes from 'bytes'

const providers = TorrentSearchApi.getProviders()
const publicProviders = providers.filter((provider) => {
    // @ts-ignore
    return provider.public
})

export interface SearchResults {
    title: string
    desc: string
    size: string
    magnet: string
}

export async function searchTorrents(
    term: string,
    category: string = 'All',
    limit: number = 20
): Promise<SearchResults[]> {
    const solidTorrents = await searchSolid(term)
    const torrents: SearchResults[] = solidTorrents.map((t) => ({
        title: t.title,
        desc: `https://solidtorrents.net/view/${t.title}/${t._id}`,
        size: bytes(t.size),
        magnet: t.magnet,
    }))

    let providerIndex = 0
    while (torrents.length < limit && providerIndex < publicProviders.length) {
        const curTorrents = await searchTorrentsUsingTorrentSearchApi(
            publicProviders[providerIndex].name,
            term,
            category,
            limit
        )
        torrents.push(...curTorrents)
        providerIndex++
    }
    return torrents
}

async function searchTorrentsUsingTorrentSearchApi(
    provider: string,
    term: string,
    category: string,
    limit: number
): Promise<SearchResults[]> {
    const torrents = await TorrentSearchApi.search(
        [provider],
        term,
        category,
        limit
    ).catch((e) => {
        console.warn(e)
        return []
    })
    return await Promise.all(
        torrents.map(async (torrent: TorrentSearchApi.Torrent) => {
            const magnet = await TorrentSearchApi.getMagnet(torrent)
            return {
                title: torrent.title,
                desc: torrent.desc,
                size: torrent.size,
                magnet,
            }
        })
    )
}
