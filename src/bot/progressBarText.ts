export function progressBar(opts: {
    progress: number
    numberOfEmojis: number
}): string {
    const green = Math.ceil(opts.progress * opts.numberOfEmojis)
    const gray = opts.numberOfEmojis - green

    const greenCircles = Array(green).fill('🟢').join('')
    const grayCircles = Array(gray).fill('◽️').join('')

    return greenCircles + grayCircles
}
