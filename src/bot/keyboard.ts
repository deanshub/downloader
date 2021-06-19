import { ReplyKeyboardMarkup } from 'telegraf/typings/core/types/typegram'
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types'

export const keyboard: ReplyKeyboardMarkup['keyboard'] = [
    [{ text: '/downloads' }],
]
export const reply_markup: ReplyKeyboardMarkup = {
    keyboard,
    resize_keyboard: true,
}
export const defaultExtra: ExtraReplyMessage = {
    reply_markup,
}
