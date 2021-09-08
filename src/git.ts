import execa from 'execa'

export async function getLatestTagDate(): Promise<Date> {
    const { stdout } = await execa(
        'git',
        ['log', '-1', '--format=%ai', '$(git rev-list --tags --max-count=1)'],
        {
            cwd: process.cwd(),
            shell: true,
        }
    )
    return new Date(stdout)
}
