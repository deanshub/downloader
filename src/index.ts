import { config } from 'dotenv'
import { setupBot } from './bot'

async function init(): Promise<void> {
    config()
    const bot = await setupBot()
}

init().catch(console.error)
