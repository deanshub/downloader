import { Telegraf, Context } from 'telegraf'
import { ToadScheduler, SimpleIntervalJob, AsyncTask } from 'toad-scheduler'
import axios from 'axios'
import execa from 'execa'
import { getAdmin } from './bot/isAdmin'

export async function setupAutoUpdate(bot: Telegraf<Context>) {
    const scheduler = new ToadScheduler()
    const task = new AsyncTask(
        'check for new release',
        () => {
            return checkForUpdate(bot)
        },
        (err: Error) => {
            bot.telegram.sendMessage(
                getAdmin(),
                `Error in update ${err.name}\n${err?.message}`
            )
        }
    )

    if (process.env.UPDATE_INTERVAL !== '0') {
        const intervalString = process.env.UPDATE_INTERVAL || '1d'

        const interval = convertToScheduleerInterval(intervalString)

        const job = new SimpleIntervalJob(
            { ...interval, runImmediately: true },
            task
        )

        scheduler.addSimpleIntervalJob(job)
    }
}

function convertToScheduleerInterval(intervalString: string) {
    const lastLetter = intervalString[intervalString.length - 1]
    const timeFrame = convertLetterToTimeFrame(lastLetter)
    const intervalAmount = Number(
        intervalString.substring(0, intervalString.length - 2)
    )
    if (isNaN(intervalAmount)) {
        throw new Error(
            `Unkown inteval "${intervalAmount}" please use a known pattern like "1d"`
        )
    }
    return { [timeFrame]: intervalAmount }
}

function convertLetterToTimeFrame(
    letter: string
): 'seconds' | 'minutes' | 'hours' | 'days' {
    switch (letter) {
        case 's':
            return 'seconds'
        case 'm':
            return 'minutes'
        case 'h':
            return 'hours'
        case 'd':
            return 'days'
        default:
            console.warn(
                `Uknown interval letter "${letter}" please use d\\h\\m\\s`
            )
            return 'days'
    }
}

type Releases = Release[]
interface Release {
    body: string | undefined
    published_at: string | undefined
    created_at: string | undefined
    tag_name: string | undefined
    name: string | undefined
}

async function checkForUpdate(bot: Telegraf<Context>) {
    // TODO: Maybe get the url from env var or origin remote and fallback to deanshub/downloader?
    const latestReleaseUrl = `https://api.github.com/repos/deanshub/downloader/releases?per_page=1`
    const response = await axios.get<Releases>(latestReleaseUrl, {
        headers: {
            Accept: 'application/vnd.github.v3+json',
        },
    })
    const latestRelease = response.data?.[0]

    const latstCommitDate = await getLatestCommitDate()
    const releaseDate = latestRelease?.published_at ?? latestRelease?.created_at
    if (
        releaseDate &&
        latstCommitDate &&
        new Date(releaseDate).getTime() > latstCommitDate.getTime()
    ) {
        const releaseVersion = latestRelease?.tag_name ?? latestRelease?.name

        bot.telegram.sendMessage(
            getAdmin(),
            `<b>A new version is available ${releaseVersion}</b>\nReleased on ${releaseDate.toLocaleString()}
Press /pull to update\nRelease notes:\n<pre>${latestRelease?.body ??
                'No release notes'}</pre>`,
            { parse_mode: 'HTML' }
        )
    }
}

async function getLatestCommitDate(): Promise<Date> {
    'git log -1 --format=%cd'
    const { stdout } = await execa('git', ['log', '-1', '--format=%cd'], {
        cwd: process.cwd(),
    })
    return new Date(stdout)
}
