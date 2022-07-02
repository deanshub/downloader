import checkDiskSpace from 'check-disk-space'
import prettysize from 'prettysize'

const downloadsDir = process.env.DOWNLOAD_DIR ?? process.cwd()

interface StorageDetails {
    diskPath: string
    freePercentage: number
    freeSpace: string
    takenSpace: string
    totalSpace: string
}

export async function getStorageDetails(): Promise<StorageDetails> {
    const diskSpace = await checkDiskSpace(downloadsDir)
    return {
        diskPath: diskSpace.diskPath,
        freePercentage: Math.round(diskSpace.free/diskSpace.size *100),
        freeSpace: prettysize(diskSpace.free),
        takenSpace: prettysize(diskSpace.size - diskSpace.free),
        totalSpace: prettysize(diskSpace.size),
    }
}