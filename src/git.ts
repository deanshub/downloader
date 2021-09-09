import execa from 'execa'

export async function getLatestCommitDate(): Promise<Date> {
    const { stdout } = await execa('git', ['log', '-1', '--format=%ai'], {
        cwd: process.cwd(),
        shell: true,
    })
    return new Date(stdout)
}
