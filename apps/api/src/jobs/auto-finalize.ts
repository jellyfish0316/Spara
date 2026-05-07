import { db } from '../db';
import { receipts } from '@spara/db';
import { eq } from 'drizzle-orm';

function getLocalDate(timezone: string): string {
    const adjusted = new Date(Date.now() - 4 * 60 * 60 * 1000);
    return adjusted.toLocaleDateString('en-CA', { timeZone: timezone });
}

export async function runAutoFinalize(): Promise<{ finalized: number }> {
    const openReceipts = await db.query.receipts.findMany({
        where: (r, ops) => ops.eq(r.state, 'open'),
    });

    let finalized = 0;
    for (const receipt of openReceipts) {
        const user = await db.query.users.findFirst({
            where: (u, ops) => ops.eq(u.id, receipt.userId),
        });
        if (!user) continue;

        const effectiveDate = getLocalDate(user.timezone);
        if (effectiveDate > receipt.localDate) {
            await db.update(receipts)
                .set({
                    state: 'finalized',
                    verdictText: 'FORGOTTEN',
                    verdictMethod: 'fallback',
                    finalizeMode: 'auto_4am',
                    finalizedAt: new Date(),
                })
                .where(eq(receipts.id, receipt.id));
            finalized++;
        }
    }

    return { finalized };
}
