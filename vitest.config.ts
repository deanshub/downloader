import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
    resolve: {
        alias: {
            bun: path.resolve(__dirname, 'src/__mocks__/bun.ts'),
        },
    },
})
