import { Telegraf, Context } from 'telegraf'
import execa from 'execa'
import { set, get } from '../cbData'
import { download, cancelDownload } from '../torrents'
import { searchTorrents } from '../search'
import { isAdmin, setupAdmins, getAdmin } from './isAdmin'
import { defaultExtra } from './keyboard'
import { downloads, handleRefreshCall } from './downloads'
import { stripHtml } from '../stripHtml'
import { checkForUpdate } from '../updater'
import { getStorageDetails } from '../getStorageDetails'
import { getMemoryDetails } from '../getMemoryDetails'
import { deleteFile, filesCommand } from '../downloadedFiles'
import { reply } from './messages'
import { message } from 'telegraf/filters'
import { downloadFile } from '../download'

export async function setupBot(): Promise<Telegraf<Context>> {
    if (!process.env.BOT_TOKEN) {
        throw new Error('No BOT_TOKEN provided')
    }
    setupAdmins()

    let config
    if (process.env.LOCAL_API_ROOT) {
        config = {
            telegram: {
                apiRoot: process.env.LOCAL_API_ROOT,
            },
        }
    }
    const bot = new Telegraf(process.env.BOT_TOKEN, config)

    bot.start((ctx) => {
        ctx.reply('Welcome', defaultExtra)
    })

    bot.help((ctx) =>
        ctx.reply('type something to search for torrents', defaultExtra)
    )

    // bot.command('download', async (ctx) => {
    //     if (!isAdmin(ctx)) {
    //         ctx.reply(`You're not an admin so you can't download`)
    //         ctx.telegram.sendMessage(
    //             getAdmin(),
    //             `${ctx.from.first_name} ${ctx.from.last_name} (${ctx.from.username} - ${ctx.from.id}) tried to download`
    //         )
    //         return
    //     }
    //     const magnetURI = getCommandText('download', ctx.message.text)
    //     const torrent = await download(magnetURI)
    //     torrent
    //         .on('done', async () => {
    //             ctx.reply(`${torrent.name} Downloaded`)
    //             await refreshDlna()
    //         })
    //         .on('error', (e) => {
    //             ctx.replyWithHTML(
    //                 `<b>${stripHtml(
    //                     torrent.name
    //                 )}</b> failed to download</b>\n${stripHtml(e.toString())}`
    //             )
    //         })
    //         .on('ready', () => {
    //             downloads(ctx, torrent.infoHash)
    //         })
    // })

    bot.hears(/^magnet:\?xt=urn:[a-z0-9]+:[a-z0-9]{32}/i, async (ctx) => {
        if (!isAdmin(ctx)) {
            ctx.reply(`You're not an admin so you can't download`)
            ctx.telegram.sendMessage(
                getAdmin(),
                `${ctx.from?.first_name} ${ctx.from?.last_name} (${ctx.from?.username} - ${ctx.from?.id}) tried to download`
            )
            return
        }
        const magnetURI = ctx.message.text
        const torrent = await download(magnetURI)
        torrent
            .on('done', async () => {
                ctx.reply(`${torrent.name} Downloaded`)
                await refreshDlna()
            })
            .on('error', (e) => {
                ctx.replyWithHTML(
                    `<b>${stripHtml(
                        torrent.name
                    )}</b> failed to download</b>\n${stripHtml(e.toString())}`
                )
            })
            .on('ready', () => {
                downloads(ctx, torrent.infoHash)
            })
    })

    bot.command('search', (ctx) => search(ctx, 'search'))

    bot.on('callback_query', async (ctx) => {
        if (!isAdmin(ctx)) {
            ctx.reply(`You're not an admin so you can't download`)
            ctx.telegram.sendMessage(
                getAdmin(),
                `${ctx.from?.first_name} ${ctx.from?.last_name} (${ctx.from?.username} - ${ctx.from?.id}) tried to download`
            )
            return
        }

        const callbackOriginalData = (ctx.callbackQuery as { data: string })
            .data

        console.log('getting cbData', callbackOriginalData)
        const cbData = get(callbackOriginalData)
        if (cbData) {
            console.log('cbData.type', cbData.type)
            if (cbData.type === 'download') {
                try {
                    console.log('cbData.data', cbData.data)
                    const torrent = await download(cbData.data)
                    console.log('got the torrent', torrent)
                    torrent
                        .on('done', () => {
                            console.log('done downloading')
                            ctx.replyWithHTML(stripHtml(`${torrent.name} Downloaded`)).catch(
                                console.warn
                            )
                        })
                        .on('error', (e) => {
                            console.error('error downloading', e)
                            ctx.replyWithHTML(
                                stripHtml(`${
                                    torrent.name
                                } Failed to download\n${e.toString()}`)
                            ).catch(console.warn)
                        })
                        .on('ready', () => {
                            console.log('torrent ready')
                            downloads(ctx, torrent.infoHash)
                        })
                        .on('warning', (e) => {
                            console.error('warning downloading', e)
                            ctx.replyWithHTML(
                                stripHtml(`${
                                    torrent.name
                                } Warning\n${e.toString()}`)
                            ).catch(console.warn)
                        })

                } catch (error) {
                    console.error(error)
                    ctx.reply(`Can't, please try later`, defaultExtra)
                }
            } else if (cbData.type === 'cancel') {
                if (cancelDownload(cbData.data)) {
                    ctx.reply(`Canceled`, defaultExtra)
                } else {
                    ctx.reply(`Can't find the torrent to cancel`, defaultExtra)
                }
            } else if (cbData.type === 'refresh') {
                await handleRefreshCall(cbData.data, ctx)
            }
        } else if (callbackOriginalData === 'delete') {
            deleteFile(
                (ctx.callbackQuery.message as { text: string }).text
            ).then(
                () => {
                    ctx.answerCbQuery('Deleted')
                },
                (e) => {
                    ctx.reply(
                        `Couldn't delete file\n${e.toString()}`,
                        defaultExtra
                    )
                }
            )
        } else if (/^filesPage\d+/.test(callbackOriginalData)) {
            const page = parseInt(callbackOriginalData.replace('filesPage', ''))
            filesCommand(ctx, page)
        } else {
            ctx.reply(`Can't, please try later`, defaultExtra)
        }
    })

    // bot.command('movies', async (ctx) => search(ctx, 'movies'))
    bot.command('downloads', async (ctx) => downloads(ctx))

    bot.command('refresh', async (ctx) => {
        await refreshDlna()
        return reply(ctx, 'Refreshed')
    })

    bot.command('check', async (ctx) => {
        const updateMessage = await checkForUpdate()
        if (updateMessage) {
            reply(ctx, updateMessage, { parse_mode: 'HTML' })
        } else {
            reply(ctx, `No updates available`)
        }
    })

    bot.command('kill', async (ctx) => {
        throw new Error('Killed')
    })
    bot.command('reset', async (ctx) => {
        bot.stop()
        setupBot()
    })

    bot.command('storage', async (ctx) => {
        const storageDetails = await getStorageDetails()
        ctx.replyWithHTML(
            `<b>${storageDetails.freeSpace} (${storageDetails.freePercentage}%)</b> Free\n${storageDetails.takenSpace} of ${storageDetails.totalSpace} taken`
        )
    })

    bot.command('memory', async (ctx) => {
        const memoryDetails = await getMemoryDetails()
        ctx.replyWithHTML(
            `<b>${memoryDetails.processMemoryString}</b> Used\nHeap ${memoryDetails.heapUsedString} used (${memoryDetails.heapPercentageString})`
        )
    })

    bot.command('files', async (ctx) => {
        await filesCommand(ctx, 0)
    })

    bot.on(message('video'), async (ctx) => {
        try {
            const video = ctx.message.video
            const filename = getVideoFilename(ctx.message.caption)
            const file = await ctx.telegram.getFileLink(video.file_id)
            await downloadFile(file.href, filename)
            await ctx.reply('Video received successfully!')
        } catch (error) {
            console.error('Error processing video:', error)
            await ctx.reply('Sorry, there was an error processing your video.')
        }
    })

    bot.on(message('text'), (ctx) => {
        search(ctx, 'search')
    })

    bot.launch().then(() => {
        console.log('Bot killed')
        bot.telegram.sendMessage(getAdmin(), 'Bot killed')
    }, console.error)

    console.log('Bot started')
    bot.telegram.sendMessage(getAdmin(), 'Bot started')

    // Enable graceful stop
    // process.once('SIGINT', () => bot.stop('SIGINT'))
    // process.once('SIGTERM', () => bot.stop('SIGTERM'))
    return bot
}

function getVideoFilename(caption?: string): string {
    const filename = caption ?? `${Date.now()}`
    const cleanedFilename = filename
        .replace(/[^a-zA-Z0-9\u0590-\u05FF\s\.\-]/g, '')
        .replace(/\s/g, '_')
    return `${cleanedFilename}.mp4`
}

function getCommandText(command: string, text: string): string {
    return text.replace(`/${command} `, '')
}

async function search(ctx: Context, command: string) {
    // @ts-ignore
    const searchTerm = getCommandText(command, ctx.message.text)
    const category = command === 'movies' ? 'Movies' : undefined
    const torrents = await searchTorrents(searchTerm, category)

    torrents
        .sort((a, b) => a.seeders - b.seeders)
        .forEach(async (torrent) => {
            const key = set({ data: torrent.magnet, type: 'download' })
            ctx.replyWithHTML(
                `<b>${torrent.size}</b>\n${stripHtml(torrent.title)}`,
                {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: '📥 Download',
                                    callback_data: key,
                                },
                                {
                                    text: '🔗 Description',
                                    url: stripHtml(torrent.desc),
                                },
                            ],
                        ],
                        remove_keyboard: true,
                        resize_keyboard: true,
                    },
                }
            ).catch(e=>{
                console.warn({
                    title: torrent.title,
                    size: torrent.size,
                    desc: torrent.desc,
                    key
                })
                console.warn(e)
            })
        })
    if (torrents.length === 0) {
        ctx.reply('No torrents found', defaultExtra)
    }
}

async function refreshDlna(): Promise<void> {
    void execa('sudo', ['service', 'minidlna', 'force-reload'])

    void execa('sudo', ['service', 'minidlna', 'restart'], {
        cwd: process.cwd(),
    })
}
