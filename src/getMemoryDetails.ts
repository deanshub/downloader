import process from "process";
import prettysize from 'prettysize'

interface MemoryDetails{
    process: number;
    heapTotal: number;
    heapUsed: number;
    processMemoryString: string;
    heapUsedString: string;
    heapPercentageString: string;
}
export async function getMemoryDetails(): Promise<MemoryDetails>{
    const usage =  process.memoryUsage()
    return {
        process: usage.rss,
        heapTotal: usage.heapTotal,
        heapUsed: usage.heapUsed,
        processMemoryString: prettysize(usage.rss),
        heapUsedString: prettysize(usage.heapUsed),
        heapPercentageString: `${Math.round(usage.heapUsed/usage.heapTotal * 100)}%`,
    }
}