import { Telegraf, Context } from 'telegraf'
import { createTextChangeRange } from 'typescript'
import WebTorrent from 'webtorrent'

var client = new WebTorrent()

export async function setupBot(): Promise<Telegraf<Context>>{
    if (!process.env.BOT_TOKEN){
        throw new Error("No BOT_TOKEN provided")
    }
    const bot = new Telegraf(process.env.BOT_TOKEN)
    bot.start((ctx) => ctx.reply('Welcome'))
    bot.help((ctx) => ctx.reply('Send me a sticker'))
    // bot.on('sticker', (ctx) => ctx.reply('👍'))
    // bot.hears('hi', (ctx) => ctx.reply('Hey there'))
    bot.command('download', ctx =>{
        const text = getCommandText('download', ctx.message.text)
        ctx.reply(text)
    })
    bot.launch()
    
    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'))
    process.once('SIGTERM', () => bot.stop('SIGTERM'))
    return bot
}


function getCommandText(command: string, text:string):string {
    return text.replace(`/${command} `,'')
}
// var magnetURI = '...'

// client.add(magnetURI, function (torrent) {
//   // Got torrent metadata!
//   console.log('Client is downloading:', torrent.infoHash)

//   torrent.files.forEach(function (file) {
//     // Display the file by appending it to the DOM. Supports video, audio, images, and
//     // more. Specify a container element (CSS selector or reference to DOM node).
//     file.appendTo('body')
//   })
// })
