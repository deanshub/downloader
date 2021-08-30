import { getCurrent } from '../downloads'
import { set } from '../cbData'
import { Context } from 'telegraf'
import {
    InlineKeyboardMarkup,
    Update,
} from 'telegraf/typings/core/types/typegram'
import { defaultExtra } from './keyboard'
import { progressBar } from './progressBarText'

export async function downloads(ctx: Context<Update>): Promise<void> {
    const downloads = getCurrent()
    downloads.forEach((download) => {
        ctx.replyWithHTML(stringifyDownload(download), {
            reply_markup: {
                ...getReplyMarkupForDownload(download),
                remove_keyboard: true,
                resize_keyboard: true,
            },
        })
    })
    if (downloads.length === 0) {
        ctx.reply('There are no current downloads', defaultExtra)
    }
}

type Download = ReturnType<typeof getCurrent>[number]
function stringifyDownload(
    download: Pick<Download, 'progress' | 'name' | 'timeRemaining'>
): string {
    const progressbar = progressBar({
        progress: download.progress,
        numberOfEmojis: 7,
    })
    const progress = `${(download.progress * 100).toFixed(2)}%`
    return `<b>${stripHtml(download.name)}</b>\n${progressbar} (${progress})\n${
        download.timeRemaining
    }`
}

function stripHtml(html: string): string {
    return html.replace(/\</g, '&lt;').replace(/\>/g, '&gt;')
}

function getReplyMarkupForDownload(download: Download): InlineKeyboardMarkup {
    return {
        inline_keyboard: [
            [
                {
                    text: '♻️ Refresh',
                    callback_data: set({
                        data: download.magnet,
                        type: 'refresh',
                    }),
                },
                {
                    text: '❌ Cancel',
                    callback_data: set({
                        data: download.magnet,
                        type: 'cancel',
                    }),
                },
            ],
        ],
    }
}

export async function handleRefreshCall(
    magnetUri: string,
    ctx: Context<Update>
): Promise<void> {
    if (!ctx.callbackQuery) return
    const download = getCurrent().find((a) => a.magnet === magnetUri)
    if (download) {
        await ctx.editMessageText(stringifyDownload(download), {
            parse_mode: 'HTML',
            reply_markup: {
                ...getReplyMarkupForDownload(download),
            },
        })
    }
}
