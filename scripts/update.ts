import execa from 'execa'

let pullInProgrerss = false

export async function update(){
    // check if there are newer commits
        // if so than run a new process that resets, pulls, yarn, and starts + kill current process
        if (pullInProgrerss) {
            return
        }
        pullInProgrerss = true
        // kill process of yarn update which is not this process
        // const { stdout: pid } = await execa('pidof', ['yarn'], {
        const { stdout: pid } = await execa('pidof yarn', {
            shell: true,
            cwd: process.cwd(),
            stdio: 'pipe',
        })
        const currentProcessId = process.pid.toString()
        if (pid !== currentProcessId) {
            await execa('kill', [pid], {
                cwd: process.cwd(),
                stdio: 'inherit',
            })
        }


        await execa('git', ['reset', '--hard'], {
            cwd: process.cwd(),
            stdio: 'inherit',
        })

        const { stdout } = await execa('git', ['pull'], {
            cwd: process.cwd(),
            stdio: 'inherit',
        })

        pullInProgrerss = false
        console.log({stdout})
        if (stdout !== 'Already up to date.') {
            await execa('yarn', {
                cwd: process.cwd(),
                stdio: 'inherit',
            })
        }

        await execa('yarn', ['dev'], {
            cwd: process.cwd(),
            stdio: 'inherit',
            detached: true,
        })
        process.exit(0)
}

update().then(() => console.log('Updated'), (err) => console.error(err))