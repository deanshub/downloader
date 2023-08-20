import { Telegraf, Context } from 'telegraf'
import { Update } from 'typegram'
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

export async function setupBot(): Promise<Telegraf<Context>> {
    if (!process.env.BOT_TOKEN) {
        throw new Error('No BOT_TOKEN provided')
    }
    setupAdmins()
    const bot = new Telegraf(process.env.BOT_TOKEN)

    bot.start((ctx) => ctx.reply('Welcome', defaultExtra))

    bot.help((ctx) =>
        ctx.reply('type /search to search for torrents', defaultExtra)
    )

    bot.command('download', async (ctx) => {
        if (!isAdmin(ctx)) {
            ctx.reply(`You're not an admin so you can't download`)
            ctx.telegram.sendMessage(
                getAdmin(),
                `${ctx.from.first_name} ${ctx.from.last_name} (${ctx.from.username} - ${ctx.from.id}) tried to download`
            )
            return
        }
        const magnetURI = getCommandText('download', ctx.message.text)
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

        const callbackOriginalData = (ctx.callbackQuery as {data: string}).data
        
        const cbData = get(callbackOriginalData)
        if (cbData) {
            if (cbData.type === 'download') {
                try {
                    const torrent = await download(cbData.data)
                    torrent
                        .on('done', () => {
                            ctx.reply(`${torrent.name} Downloaded`).catch(console.warn)
                        })
                        .on('error', (e) => {
                            ctx.reply(
                                `${
                                    torrent.name
                                } Failed to download\n${e.toString()}`
                            ).catch(console.warn)
                        })
                        .on('ready', () => {
                            downloads(ctx, torrent.infoHash)
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
            deleteFile((ctx.callbackQuery.message as {text: string}).text).then(() => {
                ctx.answerCbQuery('Deleted')
            }, (e) => {
                ctx.reply(`Couldn't delete file\n${e.toString()}`, defaultExtra)
            })
        } else if (/^filesPage\d+/.test(callbackOriginalData)) {
            const page = parseInt(callbackOriginalData.replace('filesPage', ''))
            filesCommand(ctx, page)
        } else {
            ctx.reply(`Can't, please try later`, defaultExtra)
        }
    })

    bot.command('movies', async (ctx) => search(ctx, 'movies'))
    bot.command('downloads', async (ctx) => downloads(ctx))

    // let pullInProgrerss = false
    bot.command('pull', async (ctx) => {
        // check if there are newer commits
        // if so than run a new process that resets, pulls, yarn, and starts + kill current process
        // const newCommitExists = await checkForNewCommit()

        // if (newCommitExists) {
        // ctx.reply('Updating...')
        // const currentUid = process.getuid?.() ?? 0
        // execa('yarn', ['update'], {
        //     cwd: process.cwd(),
        //     stdio: 'inherit',
        //     detached: true,
        //     uid: currentUid,
        // })
        // process.exit(0)
        // } else {
            // ctx.reply('Already up to date')
        // }
        ctx.reply('Updating...')
        process.exit(2)
    })

    bot.command('refresh', async (ctx) => {
        await refreshDlna()
        return ctx.reply('Refreshed')
    })
    bot.command('check', async (ctx) => {
        const updateMessage = await checkForUpdate()
        if (updateMessage) {
            ctx.reply(updateMessage, { parse_mode: 'HTML' })
        } else {
            ctx.reply(`No updates available`)
        }
    })

    bot.command('kill', async (ctx) => {
        process.exit(1)
    })
    bot.command('reset', async (ctx) => {
        bot.stop()
        setupBot()
    })

    bot.command('storage', async (ctx) => {
        const storageDetails = await getStorageDetails()
        ctx.replyWithHTML(`<b>${storageDetails.freeSpace} (${storageDetails.freePercentage}%)</b> Free\n${storageDetails.takenSpace} of ${storageDetails.totalSpace} taken`)
    })

    bot.command('memory', async (ctx) => {
        const memoryDetails = await getMemoryDetails()
        ctx.replyWithHTML(`<b>${memoryDetails.processMemoryString}</b> Used\nHeap ${memoryDetails.heapUsedString} used (${memoryDetails.heapPercentageString})`)
    })

    bot.command('files', async (ctx) => {
        await filesCommand(ctx, 0)
    })

    bot.launch().then(() => {
        console.log('Bot started')
        bot.telegram.sendMessage(getAdmin(), 'Bot started')
    })

    // Enable graceful stop
    // process.once('SIGINT', () => bot.stop('SIGINT'))
    // process.once('SIGTERM', () => bot.stop('SIGTERM'))
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
    torrents.sort((a,b)=>a.seeders-b.seeders).forEach(async (torrent) => {
        const key = set({ data: torrent.magnet, type: 'download' })
        ctx.replyWithHTML(`<b>${torrent.size}</b>\n${stripHtml(torrent.title)}`, {
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
        }).catch(console.warn)
    })
    if (torrents.length === 0) {
        ctx.reply('No torrents found', defaultExtra)
    }
}

async function refreshDlna(): Promise<void> {
    await execa('sudo', ['service', 'minidlna', 'force-reload'])

    await execa('sudo', ['service', 'minidlna', 'restart'], {
        cwd: process.cwd(),
    })
}

async function checkForNewCommit() {
    // fetch and see if you need to pull
    const { stdout } = await execa('git', ['fetch'], {
        cwd: process.cwd(),
        stdio: 'inherit',
    })
    if (stdout !== 'Already up to date.') {
        return true
    }
    return false
}