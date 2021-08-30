import { Telegraf, Context } from 'telegraf'
import { Update } from 'typegram'
import execa from 'execa'
import { set, get } from '../cbData'
import { download, cancelDownload } from '../downloads'
import { searchTorrents } from '../search'
import { isAdmin, setupAdmins, getAdmin } from './isAdmin'
import { defaultExtra } from './keyboard'
import { downloads, handleRefreshCall } from './downloads'

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
        torrent.on('done', async () => {
            ctx.reply(`${torrent.name} Downloaded`)
            await refreshDlna()
        })
        torrent.on('error', (e) => {
            ctx.reply(`${torrent.name} Failed to download\n${e.toString()}`)
        })
        ctx.reply(`Downloading ${torrent.name}`, defaultExtra)
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
        // @ts-ignore
        const cbData = get(ctx.callbackQuery.data)
        if (cbData) {
            if (cbData.type === 'download') {
                const torrent = await download(cbData.data)
                torrent.on('done', () => {
                    ctx.reply(`${torrent.name} Downloaded`)
                })
                torrent.on('error', (e) => {
                    ctx.reply(
                        `${torrent.name} Failed to download\n${e.toString()}`
                    )
                })
                ctx.reply(`Downloading ${torrent.name}`, defaultExtra)
            } else if (cbData.type === 'cancel') {
                if (cancelDownload(cbData.data)) {
                    ctx.reply(`Canceled`, defaultExtra)
                } else {
                    ctx.reply(`Can't find the torrent to cancel`, defaultExtra)
                }
            } else if (cbData.type === 'refresh') {
                await handleRefreshCall(cbData.data, ctx)
            }
        } else {
            ctx.reply(`Can't, please try later`, defaultExtra)
        }
    })

    bot.command('movies', async (ctx) => search(ctx, 'movies'))
    bot.command('downloads', downloads)

    bot.command('pull', async (ctx) => {
        await execa('git', ['reset', '--hard'], {
            cwd: process.cwd(),
        })

        const { stdout } = await execa('git', ['pull'], {
            cwd: process.cwd(),
        })

        if (stdout !== 'Already up to date.') {
            await execa('yarn', {
                cwd: process.cwd(),
            })
            return ctx.reply('Pulled')
        }
        ctx.reply('Already synced')
    })

    bot.command('refresh', async (ctx) => {
        await refreshDlna()
        return ctx.reply('Refreshed')
    })

    bot.launch()

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
    torrents.forEach(async (torrent) => {
        const key = set({ data: torrent.magnet, type: 'download' })
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
