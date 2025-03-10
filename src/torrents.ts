import WebTorrent from 'webtorrent'
import humanizeDuration from 'humanize-duration'
import fs from 'fs-extra'
import path from 'path'
import type { Context, Telegraf } from 'telegraf'
import { getAdmin } from './bot/isAdmin'

const client = new WebTorrent({ utp: false })

const downloads = new Set<WebTorrent.Torrent>()

const downloadsDir = process.env.DOWNLOAD_DIR ?? process.cwd()
const torrentsDir =
    process.env.TORRENTS_DIR ?? path.join(downloadsDir, 'torrents')

export async function download(magnetURI: string): Promise<WebTorrent.Torrent> {
    const torrent = client.add(magnetURI, {
        path: downloadsDir,
    })

    downloads.add(torrent)

    torrent
        .on('ready', async () => {
            const torrentFilePath = path.join(
                torrentsDir,
                `${torrent.name}.torrent`
            )
            fs.writeFile(torrentFilePath, torrent.torrentFile).catch(
                console.error
            )
        })
        .on('done', () => {
            removeTorrent(torrent)
        })

    return torrent
}

export type Download = {
    id: string
    name: string
    progress: number
    timeRemaining: string
    timeRemainingMs: number
    magnet: string
}

export function getCurrent(): Download[] {
    return Array.from(downloads).map((torrent): Download => {
        return {
            id: torrent.infoHash,
            name: torrent.name,
            progress: torrent.progress,
            timeRemaining: humanizeDuration(torrent.timeRemaining, {
                round: true,
            }),
            timeRemainingMs: torrent.timeRemaining,
            magnet: torrent.magnetURI,
        }
    })
}

export function cancelDownload(magnet: string): boolean {
    const torrent = Array.from(downloads).find((t) => t.magnetURI === magnet)
    if (torrent) {
        torrent.destroy()
        downloads.delete(torrent)
        removeTorrent(torrent)
        return true
    }
    return false
}

export async function loadFromTorrentsDir(
    bot: Telegraf<Context>
): Promise<void> {
    await fs.ensureDir(torrentsDir)
    const files = await fs.readdir(torrentsDir)
    await Promise.all(
        files
            .filter((f) => f.endsWith('.torrent'))
            .map((torrentFile) => {
                const torrentFilePath = path.join(torrentsDir, torrentFile)
                const torrent = client.add(torrentFilePath, {
                    path: downloadsDir,
                })
                downloads.add(torrent)
                torrent
                    .on('done', () => {
                        bot.telegram.sendMessage(
                            getAdmin(),
                            `${torrent.name} Downloaded`
                        )
                        removeTorrent(torrent)
                    })
                    .on('error', () => {
                        bot.telegram.sendMessage(
                            getAdmin(),
                            `${torrent.name} encountered an error and removed`
                        )
                        removeTorrent(torrent, torrentFilePath)
                    })

                torrent.resume()
            })
    )
}

async function removeTorrent(
    torrent: WebTorrent.Torrent,
    torrentPath?: string
): Promise<void> {
    const torrentFilePath =
        torrentPath ?? path.join(torrentsDir, `${torrent.name}.torrent`)
    downloads.delete(torrent)
    if (await fs.pathExists(torrentFilePath)) {
        await fs.remove(torrentFilePath).catch(console.error)
    }
}
