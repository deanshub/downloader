import { Context } from 'telegraf'

let admins: number[] = []

export function setupAdmins(): void {
    admins = (process.env.ADMINS_CHATID ?? '')
        ?.split(',')
        .map((i) => Number(i.trim()))
}

export function isAdmin(ctx: Context): boolean {
    return admins.includes(ctx.from!.id)
}

export function getAdmin(): number {
    return admins[0]
}
