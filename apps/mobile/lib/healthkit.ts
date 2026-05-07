import {
    isHealthDataAvailable,
    requestAuthorization,
    queryCategorySamples,
    CategoryValueSleepAnalysis,
} from '@kingstinct/react-native-healthkit';

const SLEEP_ID = 'HKCategoryTypeIdentifierSleepAnalysis' as const;

const ASLEEP_VALUES = new Set<number>([
    CategoryValueSleepAnalysis.asleep,
    CategoryValueSleepAnalysis.asleepCore,
    CategoryValueSleepAnalysis.asleepDeep,
    CategoryValueSleepAnalysis.asleepREM,
]);

export async function ensureHealthAuth(): Promise<boolean> {
    if (!isHealthDataAvailable()) return false;
    await requestAuthorization({ toRead: [SLEEP_ID] });
    return true;
}

export interface DailyHealthMetrics {
    awakeHours: number;
    sleepHours: number;
    sleepDebtHours: number;
}

export async function getDailyMetrics(localDate: string): Promise<DailyHealthMetrics> {
    const dayStart = new Date(localDate + 'T00:00:00');
    const startDate = new Date(dayStart.getTime() - 12 * 60 * 60 * 1000); // noon previous day
    const endDate = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);   // midnight next day

    const samples = await queryCategorySamples(SLEEP_ID, {
        filter: { date: { startDate, endDate } },
        limit: 500,
        ascending: false,
    });

    let asleepMs = 0;
    let lastWakeMs: number | null = null;

    for (const s of samples) {
        if (!ASLEEP_VALUES.has(s.value)) continue;
        const start = new Date(s.startDate).getTime();
        const end = new Date(s.endDate).getTime();
        asleepMs += end - start;
        if (lastWakeMs === null || end > lastWakeMs) lastWakeMs = end;
    }

    const sleepHours = asleepMs / (1000 * 60 * 60);
    const sleepDebtHours = Math.max(0, 8 - sleepHours);
    const awakeHours = lastWakeMs
        ? Math.max(0, (Date.now() - lastWakeMs) / (1000 * 60 * 60))
        : 0;

    return { awakeHours, sleepHours, sleepDebtHours };
}

export function formatHours(h: number): string {
    return `${Math.round(h)}h`;
}
