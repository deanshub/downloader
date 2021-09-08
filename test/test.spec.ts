import { getLatestTagDate } from '../src/git'
describe('git', () => {
    test('getLatestTagDate', async () => {
        const latestTagDate = await getLatestTagDate()
        console.log(latestTagDate)
        expect(latestTagDate).toBeTruthy()
    })
})
