import { setupBot } from './bot/bot'
import { loadFromTorrentsDir } from './torrents'
import { setupAutoUpdate } from './updater'

async function init(): Promise<void> {
    await loadFromTorrentsDir()
    const bot = await setupBot()
    setupAutoUpdate(bot)
}

// process.on('uncaughtException', console.error)
init()
// .catch(console.error)
