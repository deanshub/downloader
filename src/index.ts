import { update } from '../scripts/update'
import { setupBot } from './bot/bot'
import { loadFromTorrentsDir } from './torrents'
import { setupAutoUpdate } from './updater'

async function init(): Promise<void> {
    // update and start bot
    await update()
    const bot = await setupBot()
    await loadFromTorrentsDir(bot)
    setupAutoUpdate(bot).catch(console.warn)
}

// process.on('uncaughtException', console.error)
init()
// .catch(console.error)
