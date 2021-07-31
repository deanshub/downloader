import { Telegraf, Context } from 'telegraf'
import WebTorrent from 'webtorrent'
import { Update } from 'typegram'
import { set, get } from './cbData'
import { download, getCurrent } from './downloads'
import { searchTorrents } from './search'

var client = new WebTorrent()

const videosRegex = /\.(mp4|mkv|avi)/
const imagesRegex = /\.(png|jpg|gif)/
const audioRegex = /\.(mp3|ogg)/

export async function setupBot(): Promise<Telegraf<Context>> {
    if (!process.env.BOT_TOKEN) {
        throw new Error('No BOT_TOKEN provided')
    }
    const bot = new Telegraf(process.env.BOT_TOKEN)
    bot.start((ctx) => ctx.reply('Welcome'))
    bot.help((ctx) => ctx.reply('Send me a sticker'))
    // bot.on('sticker', (ctx) => ctx.reply('👍'))
    // bot.hears('hi', (ctx) => ctx.reply('Hey there'))
    bot.command('stream', async (ctx) => {
        const magnetURI = getCommandText('stream', ctx.message.text)
        console.log('got magnet')
        const torrent = await download(magnetURI)
        console.log('got torrent')

        torrent.on('ready', () => {
            console.log(torrent.files)
            torrent.files.forEach((file) => {
                console.log(file)
                if (videosRegex.test(file.name)) {
                    ctx.replyWithVideo({
                        source: file.createReadStream(),
                        filename: file.name,
                    })
                } else if (imagesRegex.test(file.name)) {
                    ctx.replyWithPhoto({
                        source: file.createReadStream(),
                        filename: file.name,
                    })
                } else if (audioRegex.test(file.name)) {
                    ctx.replyWithAudio({
                        source: file.createReadStream(),
                        filename: file.name,
                    })
                } else {
                    ctx.replyWithDocument({
                        source: file.createReadStream(),
                        filename: file.name,
                    })
                }
            })
        })

        torrent.on('done', () => {
            ctx.reply(`${torrent.name} Downloaded`)
            // console.log(torrent.files)
            // torrent.files.forEach((file) => {
            //     console.log(file)
            //     ctx.replyWithDocument({
            //         source: file.createReadStream(),
            //         filename: file.name,
            //     })
            // file.getBuffer((err, source) => {
            //     if (err || !source) {
            //         console.warn(err || 'no source')
            //     } else {
            // ctx.replyWithDocument({ source })
            //     }
            // })
            // })
        })
        torrent.on('error', (e) => {
            ctx.reply(`${torrent.name} Failed to download\n${e.toString()}`)
        })
    })
    bot.command('download', async (ctx) => {
        const magnetURI = getCommandText('download', ctx.message.text)
        const torrent = await download(magnetURI)
        if (isAdmin(ctx)) {
            torrent.on('done', () => {
                ctx.reply(`${torrent.name} Downloaded`)
            })
            torrent.on('error', (e) => {
                ctx.reply(`${torrent.name} Failed to download\n${e.toString()}`)
            })
            ctx.reply(`Downloading ${torrent.name}`)
        } else {
            torrent.files.forEach((file) => {
                ctx.replyWithDocument({ source: file.createReadStream() })
            })
        }
    })
    bot.command('search', (ctx) => search(ctx, 'search'))
    bot.on('callback_query', async (ctx) => {
        // @ts-ignoredownload
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
    bot.command('downloads', async (ctx) => {
        const downloads = getCurrent()
        downloads.forEach((download) => {
            ctx.replyWithMarkdown(
                `*${download.name}*\n${download.timeRemaining} (${download.progress})`,
                {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: '❌ Cancel',
                                    callback_data: download.id,
                                },
                            ],
                        ],
                        remove_keyboard: true,
                        resize_keyboard: true,
                    },
                }
            )
        })
        if (downloads.length === 0) {
            ctx.reply('There are no current downloads')
        }
    })

    bot.launch()

    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'))
    process.once('SIGTERM', () => bot.stop('SIGTERM'))
    return bot
}

function getCommandText(command: string, text: string): string {
    return text.replace(`/${command} `, '')
}

async function search(ctx: Context<Update>, command: string) {
    // @ts-ignore
    const searchTerm = getCommandText(command, ctx.message.text)
    const category = command === 'movies' ? 'Movies' : undefined
    const torrents = await searchTorrents(searchTerm, category)
    torrents.forEach(async (torrent) => {
        const key = set(torrent.magnet)
        ctx.replyWithMarkdown(`*${torrent.size}*\n${torrent.title}`, {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: '📥 Download',
                            callback_data: key,
                        },
                        {
                            text: '🔗 Description',
                            url: torrent.desc,
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

const admins: number[] = (process.env.ADMINS_CHATID ?? '')
    .split(',')
    .map(Number)
function isAdmin(ctx: Context<Update>): boolean {
    const userId = ctx.message?.from.id ?? 0
    return admins.includes(userId)
}
