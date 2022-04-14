import checkDiskSpace from 'check-disk-space'
// @ts-expect-error
import prettysize from 'prettysize'

const downloadsDir = process.env.DOWNLOAD_DIR ?? process.cwd()

interface StorageDetails {
    diskPath: string
    freePercentage: number
    takenSpace: string
    totalSpace: string
}

export async function getStorageDetails(): Promise<StorageDetails> {
    const diskSpace = await checkDiskSpace(downloadsDir)
    return {
        diskPath: diskSpace.diskPath,
        freePercentage: Math.round(diskSpace.free/diskSpace.size *100),
        takenSpace: prettysize(diskSpace.size - diskSpace.free),
        totalSpace: prettysize(diskSpace.size),
    }
}