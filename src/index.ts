import { setupBot } from './bot/bot'
import { loadFromTorrentsDir } from './torrents'
import { setupAutoUpdate } from './updater'

async function init(): Promise<void> {
    const bot = await setupBot()
    await loadFromTorrentsDir(bot)
    setupAutoUpdate(bot).catch(console.warn)
}

// process.on('uncaughtException', console.error)
init()
// .catch(console.error)
