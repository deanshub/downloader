import { describe, it, expect } from 'vitest'
import { getVideoFilename } from './bot'

describe('getVideoFilename', () => {
    it('should return timestamp-based name when no caption', async () => {
        const result = await getVideoFilename()
        expect(result).toMatch(/^\d+\.mp4$/)
    })

    it('should keep ASCII-only captions as-is', async () => {
        const result = await getVideoFilename('my video 720p')
        expect(result).toBe('my_video_720p.mp4')
    })

    it('should translate Hebrew caption to English', async () => {
        const result = await getVideoFilename('שלום עולם')
        console.log('Hebrew only:', result)
        expect(result).toMatch(/\.mp4$/)
        expect(result).not.toMatch(/[\u0590-\u05FF]/)
        expect(result.length).toBeGreaterThan(4)
    })

    it('should handle mixed Hebrew and ASCII', async () => {
        const result = await getVideoFilename('אבא מטפלת - עונה 5 720p HDTV')
        console.log('Mixed:', result)
        expect(result).toMatch(/\.mp4$/)
        expect(result).not.toMatch(/[\u0590-\u05FF]/)
        expect(result).toMatch(/5/)
        expect(result).toMatch(/720p/)
        expect(result).toMatch(/HDTV/)
    })

    it('should handle underscores and dashes in caption', async () => {
        const result = await getVideoFilename('אבא_מטפלת_-_עונה_5_720p_HDTV')
        console.log('With underscores:', result)
        expect(result).toMatch(/\.mp4$/)
        expect(result).not.toMatch(/[\u0590-\u05FF]/)
        expect(result).toMatch(/720p/)
    })

    it('should strip emoji', async () => {
        const result = await getVideoFilename('אבא מטפלת 🤬 720p')
        console.log('With emoji:', result)
        expect(result).toMatch(/\.mp4$/)
        expect(result).not.toMatch(/[\u{1F000}-\u{1FFFF}]/u)
        expect(result).toMatch(/720p/)
    })
})
