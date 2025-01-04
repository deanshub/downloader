import fs from 'fs/promises'
import path from 'path'

const downloadDir = process.env.DOWNLOAD_DIR ?? process.cwd()

export async function downloadFile(url: string, filename: string) {
    const response = await fetch(url, {
        headers: { 'Content-Type': 'application/octet-stream' },
    })
    const blob = await response.blob()
    const arrayBuffer = await blob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    await fs.writeFile(path.join(downloadDir, filename), buffer)
}
