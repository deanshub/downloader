import { getCurrent, Download } from '../torrents'
import { set } from '../cbData'
import { Context } from 'telegraf'
import {
    InlineKeyboardMarkup,
    Update,
} from 'telegraf/typings/core/types/typegram'
import { defaultExtra } from './keyboard'
import { progressBar } from './progressBarText'
import { stripHtml } from '../stripHtml'

export async function downloads(
    ctx: Context<Update>,
    filteredId?: string
): Promise<void> {
    const currentDownloads = getCurrent()
    currentDownloads
        .filter((download) => (filteredId ? download.id === filteredId : true))
        .forEach((download) => {
            ctx.replyWithHTML(stringifyDownload(download), {
                reply_markup: {
                    ...getReplyMarkupForDownload(download),
                    remove_keyboard: true,
                    resize_keyboard: true,
                },
            })
        })
    if (currentDownloads.length === 0) {
        ctx.reply('There are no current downloads', defaultExtra)
    }
}

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
