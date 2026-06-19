import { $ } from 'bun'
import path from 'path'

const sonarrDir = process.env.SONARR_DIR
const radarrDir = process.env.RADARR_DIR

export type MnamerResult = {
    moved: boolean
    destination?: string
    filename?: string
}

export async function mnamer(filePath: string): Promise<MnamerResult> {
    if (!sonarrDir || !radarrDir) {
        return { moved: false }
    }

    try {
        const stdout =
            await $`mnamer --batch --no-guess --movie-directory=${radarrDir} --episode-directory=${sonarrDir} ${filePath}`.text()

        const movedTo = parseDestination(stdout, filePath)
        if (movedTo) {
            return {
                moved: true,
                destination: movedTo.dir,
                filename: movedTo.filename,
            }
        }
        return { moved: false }
    } catch (e) {
        console.error('mnamer failed:', e)
        return { moved: false }
    }
}

function parseDestination(
    output: string,
    originalPath: string
): { dir: string; filename: string } | null {
    const lines = output.split('\n')
    for (const line of lines) {
        if (line.includes('moving to')) {
            const match = line.match(/moving to ['"]?(.+?)['"]?\s*$/)
            if (match) {
                const dest = match[1]
                const filename = path.basename(dest)
                const dir = path.dirname(dest)
                if (dir.startsWith(radarrDir!)) return { dir: 'Movies', filename }
                if (dir.startsWith(sonarrDir!)) return { dir: 'TV Shows', filename }
                return { dir: path.basename(dir), filename }
            }
        }
    }
    return null
}
