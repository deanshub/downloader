import { getLatestCommitDate } from '../src/git'
describe('git', () => {
    test('getLatestCommitDate', async () => {
        const latestTagDate = await getLatestCommitDate()
        expect(latestTagDate).toBeTruthy()
    })
})
