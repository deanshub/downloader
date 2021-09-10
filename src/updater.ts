import { Telegraf, Context } from 'telegraf'
import { ToadScheduler, SimpleIntervalJob, AsyncTask } from 'toad-scheduler'
import axios from 'axios'
import { getAdmin } from './bot/isAdmin'
import { getLatestCommitDate } from './git'

export async function setupAutoUpdate(bot: Telegraf<Context>) {
    const scheduler = new ToadScheduler()
    const task = new AsyncTask(
        'check for new release',
        async () => {
            const updateMessage = await checkForUpdate()
            if (updateMessage) {
                bot.telegram.sendMessage(getAdmin(), updateMessage, {
                    parse_mode: 'HTML',
                })
            }
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
        intervalString.substring(0, intervalString.length - 1)
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
type Tags = Tag[]
interface Tag {
    name: string
    zipball_url: string
    tarball_url: string
    commit: {
        sha: string
        url: string
    }
    node_id: string
}
interface Commit {
    commit: {
        committer: {
            date: string
        }
        author: {
            date: string
        }
    }
}
export async function checkForUpdate(): Promise<string | null> {
    const latstCommitDate = await getLatestCommitDate()

    // TODO: Maybe get the url from env var or origin remote and fallback to deanshub/downloader?
    const latestReleaseUrl = `https://api.github.com/repos/deanshub/downloader/releases?per_page=1`
    const releaseResponse = await axios.get<Releases>(latestReleaseUrl, {
        headers: {
            Accept: 'application/vnd.github.v3+json',
        },
    })

    const latestTagsUrl = `https://api.github.com/repos/deanshub/downloader/tags?per_page=1`
    const tagsResponse = await axios.get<Tags>(latestTagsUrl, {
        headers: {
            Accept: 'application/vnd.github.v3+json',
        },
    })
    const latestTag = tagsResponse.data?.[0]
    const latestCommitUrl = latestTag.commit.url
    const commitResponse = await axios.get<Commit>(latestCommitUrl, {
        headers: {
            Accept: 'application/vnd.github.v3+json',
        },
    })

    const releaseCommitDate = new Date(
        commitResponse.data.commit.committer.date ||
            commitResponse.data.commit.author.date
    )

    if (releaseCommitDate.getTime() > latstCommitDate.getTime()) {
        const releaseVersion = latestTag.name

        return `<b>A new version is available ${releaseVersion}</b>\nReleased on ${releaseCommitDate.toLocaleString()}
        Press /pull to update\nRelease notes:\n<pre>${
            releaseResponse.data?.[0]?.body ?? 'No release notes'
        }</pre>`
    }
    return null
}
