import type { Context } from 'telegraf'
import type {
    Update,
} from 'telegraf/typings/core/types/typegram'
import { defaultExtra } from './keyboard'
import type { ExtraReplyMessage } from 'telegraf/typings/telegram-types'

export async function reply(ctx: Context<Update>, message: string, extra?: ExtraReplyMessage) {
    try {
        return await ctx.reply(message, extra ?? defaultExtra)
    } catch (error) {
        console.error('Could not reply to message')        
        console.error(error)        
    }
}