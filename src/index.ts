import { setupBot } from './bot/bot'
import { loadFromTorrentsDir } from './downloads'

async function init(): Promise<void> {
    await loadFromTorrentsDir()
    const bot = await setupBot()
}

process.on('uncaughtException', console.error)
init().catch(console.error)
