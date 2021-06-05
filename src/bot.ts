import { Telegraf, Context } from 'telegraf'
import WebTorrent from 'webtorrent'
import TorrentSearchApi from 'torrent-search-api'
import { set, get } from './cbData'
import { Update } from 'typegram'

var client = new WebTorrent()

const providers = TorrentSearchApi.getProviders()
TorrentSearchApi.enableProvider('1337x')
// providers.forEach(provider=>{
//     // @ts-ignore
//     if(provi''der.public){
//         console.log(provider)
//         // TorrentSearchApi.enableProvider(provider.name);
//     }
// })

export async function setupBot(): Promise<Telegraf<Context>> {
    if (!process.env.BOT_TOKEN) {
        throw new Error('No BOT_TOKEN provided')
    }
    const bot = new Telegraf(process.env.BOT_TOKEN)
    bot.start((ctx) => ctx.reply('Welcome'))
    bot.help((ctx) => ctx.reply('Send me a sticker'))
    // bot.on('sticker', (ctx) => ctx.reply('👍'))
    // bot.hears('hi', (ctx) => ctx.reply('Hey there'))
    bot.command('download', async (ctx) => {
        const magnetURI = getCommandText('download', ctx.message.text)
        const torrent = await download(magnetURI)
        torrent.on('done', () => {
            ctx.reply(`${torrent.name} Downloaded`)
        })
        torrent.on('error', (e) => {
            ctx.reply(`${torrent.name} Failed to download\n${e.toString()}`)
        })
        ctx.reply(`Downloading ${torrent.name}`)
    })
    bot.command('search', (ctx) => search(ctx, 'search'))
    bot.on('callback_query', async (ctx) => {
        // @ts-ignore
        const magnet = get(ctx.callbackQuery.data)
        if (magnet) {
            const torrent = await download(magnet)
            torrent.on('done', () => {
                ctx.reply(`${torrent.name} Downloaded`)
            })
            torrent.on('error', (e) => {
                ctx.reply(`${torrent.name} Failed to download\n${e.toString()}`)
            })
            ctx.reply(`Downloading ${torrent.name}`)
        } else {
            ctx.reply(`Can't download, please try later`)
        }
    })
    bot.command('movies', async (ctx) => search(ctx, 'movies'))

    bot.launch()

    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'))
    process.once('SIGTERM', () => bot.stop('SIGTERM'))
    return bot
}

function getCommandText(command: string, text: string): string {
    return text.replace(`/${command} `, '')
}

async function download(magnetURI: string): Promise<WebTorrent.Torrent> {
    return new Promise((resolve, reject) => {
        client.add(
            magnetURI,
            { path: process.env.DOWNLOAD_DIR ?? process.cwd() },
            (torrent) => {
                resolve(torrent)
            }
        )
    })
}

async function search(ctx: Context<Update>, command: string) {
    // @ts-ignore
    const searchTerm = getCommandText(command, ctx.message.text)
    const category = command === 'movies' ? 'Movies' : 'All'
    const torrents = await TorrentSearchApi.search(
        searchTerm,
        category,
        20
    ).catch((e) => {
        console.warn(e)
        return []
    })
    torrents.forEach(async (torrent) => {
        const magnet = await TorrentSearchApi.getMagnet(torrent)
        const key = set(magnet)
        ctx.replyWithMarkdown(`*${torrent.size}*\n${torrent.title}`, {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: '📥 Download',
                            callback_data: key,
                        },
                    ],
                ],
                remove_keyboard: true,
                resize_keyboard: true,
            },
        })
    })
    if (torrents.length === 0) {
        ctx.reply('No torrents found')
    }
}
