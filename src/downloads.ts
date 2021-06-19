import WebTorrent from 'webtorrent'
import humanizeDuration from 'humanize-duration'

const client = new WebTorrent()

const downloads = new Set<WebTorrent.Torrent>()

export async function download(magnetURI: string): Promise<WebTorrent.Torrent> {
    const torrent = client.add(magnetURI, {
        path: process.env.DOWNLOAD_DIR ?? process.cwd(),
    })

    downloads.add(torrent)

    torrent
        .on('done', () => {
            downloads.delete(torrent)
        })
        .on('error', () => {
            downloads.delete(torrent)
        })

    return torrent
}

export function getCurrent() {
    return Array.from(downloads).map((torrent) => {
        return {
            id: torrent.infoHash,
            name: torrent.name,
            progress: `${(torrent.progress * 100).toFixed(2)}%`,
            timeRemaining: humanizeDuration(torrent.timeRemaining),
            magnet: torrent.magnetURI,
        }
    })
}

export function cancelDownload(magnet: string): boolean {
    const download = Array.from(downloads).find((t) => t.magnetURI === magnet)
    if (download) {
        download.destroy()
        return true
    }
    return false
}
