import { config } from 'dotenv'
import { setupBot } from './bot/bot'

async function init(): Promise<void> {
    config()
    const bot = await setupBot()
}

process.on('uncaughtException', console.error)
init().catch(console.error)
