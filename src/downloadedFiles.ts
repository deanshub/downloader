import path from 'path'
import fs from 'fs-extra'
import prettysize from 'prettysize'

const FILES_COUNT = 10

interface DownloadedFile {
    name: string
    path: string
    size: number
    stats: fs.Stats
    isDirectory: boolean
}

export async function getFiles(page: number = 0): Promise<DownloadedFile[]> {
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
    return sortedByDateFiles.slice(
        page * FILES_COUNT,
        page * FILES_COUNT + FILES_COUNT
    )
}

export function messageForFile(file: DownloadedFile): string {
    return `${file.name} ${file.isDirectory ? '📁' : '📄'} (${prettysize(file.size)})`
}