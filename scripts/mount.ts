import execa from 'execa'
import fs from 'fs-extra'

async function mount() {
    const { stdout } = await execa('fdisk', ['-l'], {
        cwd: process.cwd(),
        stdio: 'inherit',
    })
    if (!stdout.includes('/dev/sdb1')) {
        throw new Error('No external drive found')
    }

    await fs.ensureDirSync('/media/external')

    await execa('mount', ['/dev/sdb1', '/media/external'], {
        cwd: process.cwd(),
        stdio: 'inherit',
    })
}

mount().then(console.log).catch(console.error)