import * as esbuild from 'esbuild'
import tsconfig from '../tsconfig.json'
import pkg from '../package.json'

async function build(): Promise<void> {
    await esbuild.build({
        bundle: true,
        format: 'cjs',
        platform: 'node',
        minify: true,
        logLevel: 'silent',
        outdir: tsconfig.compilerOptions.outDir,
        entryPoints: [`src/${pkg.module}`],
        target: [tsconfig.compilerOptions.target],
    })
}
build()
