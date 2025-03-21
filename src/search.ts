import TorrentSearchApi from 'torrent-search-api'
// import PirateBay from 'thepiratebay'
// import yts from 'yts'
// import { searchSolid } from './solidTorrents'
// import bytes from 'bytes'

const providers = TorrentSearchApi.getProviders()
const publicProviders = providers.filter((provider) => {
    // @ts-ignore
    return provider.public
})
publicProviders.forEach((provider) => {
    TorrentSearchApi.enableProvider(provider.name)
})

export interface SearchResults {
    title: string
    desc: string
    size: string
    magnet: string
    seeders: number
}

export async function searchTorrents(
    term: string,
    category: string = 'All',
    limit: number = 20
): Promise<SearchResults[]> {
    // const solidTorrents = await searchSolid(term)
    // const torrents: SearchResults[] = solidTorrents.map((t) => ({
    //     title: t.title,
    //     desc: `https://solidtorrents.net/view/${encodeURIComponent(t.title)}/${t._id}`,
    //     size: bytes(t.size),
    //     magnet: t.magnet,
    //     seeders: t.swarm.seeders
    // }))
    const torrents: SearchResults[] = []

    // console.log('solid',torrents.length)
    // const priateBayResults = await searchPirateBay(term, category)
    // torrents.push(...priateBayResults)
    // console.log('pb',torrents.length)

    // let providerIndex = 0
    // while (torrents.length < limit && providerIndex < publicProviders.length) {
    //     const curTorrents = await searchTorrentsUsingTorrentSearchApi(
    //         publicProviders[providerIndex].name,
    //         term,
    //         category,
    //         limit
    //     )
    //     torrents.push(...curTorrents)
    //     providerIndex++
    // }

    const curTorrents = await searchTorrentsUsingTorrentSearchApi(
        publicProviders.map((p) => p.name),
        term,
        category,
        limit * 2
    )
    torrents.push(...curTorrents.slice(0, limit))
    return torrents
}

async function searchTorrentsUsingTorrentSearchApi(
    provider: string | string[],
    term: string,
    category: string,
    limit: number
): Promise<SearchResults[]> {
    const [torrents] = await Promise.all([
        TorrentSearchApi.search(
            Array.isArray(provider) ? provider : [provider],
            term,
            category,
            limit
        ).catch((e) => {
            console.warn(e)
            return []
        }),
        // yts.listMovies({ limit, query_term: term }),
    ])

    const fullResults = await Promise.allSettled(
        torrents.map(
            async (torrent: TorrentSearchApi.Torrent, index, torrents) => {
                const magnet = await TorrentSearchApi.getMagnet(torrent)

                return {
                    title: torrent.title,
                    desc: torrent.desc,
                    size: torrent.size,
                    magnet,
                    seeders: torrents.length - index,
                }
            }
        )
        // .concat(
        //     ytsResults.map(async (r) => ({
        //         title: r.movie.title,
        //         desc: r.movie.description_intro,
        //         size: r.movie.torrents[0].size,
        //         magnet: r.movie.torrents[0].magnet_url,
        //         seeders: r.movie.torrents[0].seeds,
        //     }))
        // )
    )

    return fullResults
        .filter((r) => r.status === 'fulfilled')
        .map((r) => r.value)
}

// async function searchPirateBay(
//     term: string,
//     category: string
// ): Promise<SearchResults[]> {
//     const priateBayResults = await PirateBay.search(term, {
//         category,
//     }).catch((e) => {
//         console.warn(e)
//         console.error("Can't search pirate bay")
//         return []
//     })

//     const results: SearchResults[] = priateBayResults.map((r) => ({
//         title: r.name,
//         desc: r.link,
//         size: r.size,
//         magnet: r.magnetLink,
//         seeders: Number(r.seeders),
//     }))

//     return results
// }
