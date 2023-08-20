import path from 'path'
import fs from 'fs-extra'
import { getStorageDetails } from './getStorageDetails'
import prettysize from 'prettysize'

const FILES_COUNT = 10

interface DownloadedFile {
    name: string
    path: string
    size: number
    stats: fs.Stats
    isDirectory: boolean
}

async function getFiles(
    page: number = 0
): Promise<{ totalPages: number; page: DownloadedFile[] }> {
    const downloadDir = process.env.DOWNLOAD_DIR ?? process.cwd()
    const files = await fs.readdir(downloadDir, { withFileTypes: true })
    const sortedByDateFiles = files
        .map((file) => {
            const stats = fs.statSync(path.join(downloadDir, file.name))
            return {
                name: file.name,
                path: path.join(downloadDir, file.name),
                stats,
                isDirectory: file.isDirectory(),
                size: file.isDirectory() ? 0 : stats.size,
            }
        })
        .sort((a, b) => {
            return a.stats.mtime.getTime() - b.stats.mtime.getTime()
        })
    return {
        totalPages: Math.ceil(files.length / FILES_COUNT),
        page: sortedByDateFiles.slice(
            page * FILES_COUNT,
            page * FILES_COUNT + FILES_COUNT
        ),
    }
}

function messageForFile(file: DownloadedFile): string {
    return `${file.isDirectory ? '📁' : '📄'} ${file.name}`
}

export async function deleteFile(filePath: string): Promise<void>{
    const clearedFilePath = filePath.replace(/^📁 /, '').replace(/^📄 /, '')
    const downloadDir = process.env.DOWNLOAD_DIR ?? process.cwd()
    await fs.remove(path.join(downloadDir, clearedFilePath))
}

export async function filesCommand(ctx: any, pageNumber: number){
    const files = await getFiles(pageNumber)
    const storageDetails = await getStorageDetails()
    await Promise.all(files.page.map(async file=>{
        await ctx.replyWithHTML(messageForFile(file),{
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: `❌ Delete ${prettysize(file.size)}`,
                            callback_data: 'delete'
                        }
                    ]
                ],
                remove_keyboard: true,
            }
        }).catch(console.warn)
    }))
    const inline_keyboard_buttons = []
    if (pageNumber > 0) {
        inline_keyboard_buttons.push({
            text: '⬅️ Previous',
            callback_data: 'files ' + (pageNumber - 1)
        })
    }
    if (files.totalPages > 1 && pageNumber < files.totalPages - 1) {
        inline_keyboard_buttons.push({
            text: 'Next ⏭️',
            callback_data: `filesPage${pageNumber + 1}`
        })
    }

    await ctx.replyWithHTML(`<b>${storageDetails.takenSpace} full</b>\nPage ${pageNumber + 1} out of ${files.totalPages}`,{
        reply_markup: {
            inline_keyboard: [
                inline_keyboard_buttons
            ],
            remove_keyboard: true,
        }
    }).catch(console.warn)
}