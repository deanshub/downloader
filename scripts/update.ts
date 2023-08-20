import execa from 'execa'

let pullInProgrerss = false

export async function update(){
        // check if there are newer commits
        const { stdout } = await execa('git', ['status', '-uno'], {
            cwd: process.cwd(),
            stdio: 'pipe',
        })
        console.log({stdout})
        const noNewCommit = /Your branch is up to date with \'origin\/master\'/.test(stdout)
        // if so than run a new process that resets, pulls, yarn, and starts + kill current process
        if (pullInProgrerss || noNewCommit) {
            return
        }
        pullInProgrerss = true
        // kill process of yarn update which is not this process
        // const { stdout: pid } = await execa('pidof', ['yarn'], {
        // const { stdout: pid } = await execa('pidof yarn', {
        //     shell: true,
        //     cwd: process.cwd(),
        //     stdio: 'pipe',
        // })
        // const currentProcessId = process.pid.toString()
        // if (pid !== currentProcessId) {
        //     await execa('kill', [pid], {
        //         cwd: process.cwd(),
        //         stdio: 'inherit',
        //     })
        // }

        await execa('git', ['reset', '--hard'], {
            cwd: process.cwd(),
            stdio: 'inherit',
        })

        const { stdout: pullStdOut } = await execa('git', ['pull'], {
            cwd: process.cwd(),
            stdio: 'inherit',
        })

        if (pullStdOut !== 'Already up to date.') {
            await execa('yarn', {
                cwd: process.cwd(),
                stdio: 'inherit',
            })
        }
        pullInProgrerss = false

        // await execa('yarn', ['dev'], {
        //     cwd: process.cwd(),
        //     stdio: 'inherit',
        //     detached: true,
        // })
        // process.exit(0)
}

// update().then(() => console.log('Updated'), (err) => {
//     console.log('Failed to update')
//     console.error(err)
// })